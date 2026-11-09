import type { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createCustomerAccountWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { CATEGORIES, COLLECTIONS, COLORS, PRODUCTS, SIZES, garmentSvg } from "./lib/illustrations"
import { GIFT_CARD_PRODUCT_HANDLE } from "../lib/gift-cards"
import { PROFILE_MODULE } from "../modules/profile"
import type ProfileModuleService from "../modules/profile/service"

const COUNTRIES = ["us", "ca", "gb", "de", "fr", "nl", "se", "au", "ae", "pk", "in"]
const uploadSvg = async (container: MedusaContainer, filename: string, svg: string) => {
  const fileModule = container.resolve(Modules.FILE)
  const [file] = await fileModule.createFiles([
    { filename, mimeType: "image/svg+xml", content: Buffer.from(svg).toString("base64"), access: "public" },
  ])
  return file.url
}

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const salesChannels = container.resolve(Modules.SALES_CHANNEL)
  const storeModule = container.resolve(Modules.STORE)

  const { data: existingRegions } = await query.graph({ entity: "region", fields: ["id"] })
  if (existingRegions.length) {
    logger.info("[seed] Store already seeded — skipping.")
    return
  }

  logger.info("[seed] Store & sales channel…")
  const [store] = await storeModule.listStores()
  // Medusa creates a default sales channel (+ publishable key) on first boot — reuse it.
  let channel: any = store.default_sales_channel_id
    ? await salesChannels.retrieveSalesChannel(store.default_sales_channel_id).catch(() => null)
    : null
  if (channel) {
    channel = await salesChannels.updateSalesChannels(channel.id, { name: "Nemaya Web", description: "Nemaya storefront" })
  }
  if (!channel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Nemaya Web", description: "Storefront at nemaya" }] },
    })
    channel = result[0]
  }
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Nemaya",
        supported_currencies: [{ currency_code: "usd", is_default: true }],
        default_sales_channel_id: channel.id,
      },
    },
  })

  logger.info("[seed] Region & tax…")
  const stripeEnabled = !!process.env.STRIPE_API_KEY
  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Worldwide",
          currency_code: "usd",
          countries: COUNTRIES,
          // Stripe test mode only. Without a key (local quick-start) the system provider lets you test checkout.
          payment_providers: stripeEnabled ? ["pp_stripe_stripe"] : ["pp_system_default"],
        },
      ],
    },
  })
  const region = regions[0]
  await createTaxRegionsWorkflow(container).run({ input: COUNTRIES.map((country_code) => ({ country_code, provider_id: "tp_system" })) })

  logger.info("[seed] Warehouse & shipping…")
  const { result: locations } = await createStockLocationsWorkflow(container).run({
    input: { locations: [{ name: "Nemaya Studio", address: { city: "Lahore", country_code: "PK", address_1: "Studio 1" } }] },
  })
  const location = locations[0]
  await updateStoresWorkflow(container).run({ input: { selector: { id: store.id }, update: { default_location_id: location.id } } })
  await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: location.id }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } })

  let [profile] = await fulfillment.listShippingProfiles({ type: "default" })
  if (!profile) {
    const { result } = await createShippingProfilesWorkflow(container).run({ input: { data: [{ name: "Default", type: "default" }] } })
    profile = result[0]
  }
  const fset = await fulfillment.createFulfillmentSets({
    name: "Worldwide delivery",
    type: "shipping",
    service_zones: [{ name: "Worldwide", geo_zones: COUNTRIES.map((country_code) => ({ country_code, type: "country" as const })) }],
  })
  await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: location.id }, [Modules.FULFILLMENT]: { fulfillment_set_id: fset.id } })

  const shippingRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]
  const standardPrices: any[] = [
    { currency_code: "usd", amount: 8 },
    { currency_code: "usd", amount: 0, rules: [{ attribute: "item_total", operator: "gte", value: 99 }] },
  ]
  const shippingOptions = (prices: any[]) => [
    {
      name: "Standard",
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: fset.service_zones[0].id,
      shipping_profile_id: profile.id,
      type: { label: "Standard", description: "4–7 business days. Free over $99.", code: "standard" },
      prices,
      rules: shippingRules,
    },
    {
      name: "Express",
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: fset.service_zones[0].id,
      shipping_profile_id: profile.id,
      type: { label: "Express", description: "1–2 business days.", code: "express" },
      prices: [{ currency_code: "usd", amount: 18 }],
      rules: shippingRules,
    },
  ]
  try {
    await createShippingOptionsWorkflow(container).run({ input: shippingOptions(standardPrices) })
  } catch (e: any) {
    logger.warn(`[seed] conditional shipping price not supported (${e.message}); using flat price.`)
    await createShippingOptionsWorkflow(container).run({ input: shippingOptions([{ currency_code: "usd", amount: 8 }]) })
  }
  await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channel.id] } })

  logger.info("[seed] Publishable API key…")
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "revoked_at", "sales_channels.id"],
    filters: { type: "publishable" },
  })
  let key = (existingKeys as any[]).find((k) => !k.revoked_at)
  if (!key) {
    const { result: keys } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: "Nemaya Storefront", type: "publishable", created_by: "" }] },
    })
    key = keys[0]
  }
  if (!(key.sales_channels ?? []).some((s: any) => s.id === channel.id)) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } })
  }

  logger.info("[seed] Categories & collections…")
  const categoryNames = [...new Set(PRODUCTS.map((p) => p.category))]
  const { result: categories } = await createProductCategoriesWorkflow(container).run({
    input: { product_categories: categoryNames.map((name) => {
        const meta = CATEGORIES.find((c) => c.name === name)
        return { name, handle: meta?.handle ?? name.toLowerCase(), description: meta?.blurb, is_active: true }
      }) },
  })
  const catId = Object.fromEntries(categories.map((c) => [c.name, c.id]))
  const { result: collections } = await createCollectionsWorkflow(container).run({
    input: { collections: COLLECTIONS.map((c) => ({ title: c.title, handle: c.handle, metadata: { description: c.description } })) },
  })
  const colId = Object.fromEntries(collections.map((c) => [c.title, c.id]))

  logger.info("[seed] Products (uploading illustrations)…")
  const productInputs: any[] = []
  for (const p of PRODUCTS) {
    const sizes = p.sizes ?? SIZES
    const images: { url: string }[] = []
    for (const color of p.colors) {
      images.push({ url: await uploadSvg(container, `${p.handle}-${color}.svg`, garmentSvg(p.garment, color, 0)) })
    }
    images.push({ url: await uploadSvg(container, `${p.handle}-detail.svg`, garmentSvg(p.garment, p.colors[0], 1)) })

    productInputs.push({
      title: p.title,
      handle: p.handle,
      description: p.description,
      subtitle: p.material,
      status: ProductStatus.PUBLISHED,
      category_ids: [catId[p.category]],
      collection_id: p.collection ? colId[p.collection] : undefined,
      shipping_profile_id: profile.id,
      thumbnail: images[0].url,
      images,
      material: p.material,
      metadata: { colors: Object.fromEntries(p.colors.map((c) => [COLORS[c].label, COLORS[c].hex])) },
      options: [
        { title: "Color", values: p.colors.map((c) => COLORS[c].label) },
        { title: "Size", values: sizes },
      ],
      variants: p.colors.flatMap((color) =>
        sizes.map((size) => ({
          title: `${COLORS[color].label} / ${size}`,
          sku: `${p.handle}-${color}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
          options: { Color: COLORS[color].label, Size: size },
          manage_inventory: true,
          prices: [{ amount: p.price, currency_code: "usd" }],
          metadata: { image: images[p.colors.indexOf(color)].url },
        }))
      ),
      sales_channels: [{ id: channel.id }],
    })
  }

  // digital gift card product — custom amounts are set per line item at checkout
  const giftImage = await uploadSvg(container, "gift-card.svg", garmentSvg("giftcard", "clay", 0))
  productInputs.push({
    title: "Nemaya Gift Card",
    handle: GIFT_CARD_PRODUCT_HANDLE,
    description: "A digital gift card delivered by email — on the date you choose.",
    status: ProductStatus.PUBLISHED,
    is_giftcard: true,
    discountable: false,
    thumbnail: giftImage,
    images: [{ url: giftImage }],
    options: [{ title: "Type", values: ["Digital"] }],
    variants: [{ title: "Digital", sku: "NEMAYA-GIFT-CARD", options: { Type: "Digital" }, manage_inventory: false, prices: [{ amount: 50, currency_code: "usd" }] }],
    sales_channels: [{ id: channel.id }],
  })

  const { result: products } = await createProductsWorkflow(container).run({ input: { products: productInputs } })

  logger.info("[seed] Inventory…")
  const { data: inventoryItems } = await query.graph({ entity: "inventory_item", fields: ["id", "sku"] })
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item: any, i: number) => ({
        location_id: location.id,
        inventory_item_id: item.id,
        // a few sold-out variants to demo "back in stock" alerts
        stocked_quantity: i % 17 === 5 ? 0 : 40 + (i % 7) * 10,
      })),
    },
  })

  logger.info("[seed] Sale price list…")
  const saleVariants = products
    .map((prod) => ({ prod, seed: PRODUCTS.find((p) => p.handle === prod.handle) }))
    .filter((x) => x.seed?.sale)
  if (saleVariants.length) {
    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: "Earth Week Sale",
            description: "Launch markdowns",
            status: "active" as any,
            prices: saleVariants.flatMap(({ prod, seed }) =>
              (prod.variants ?? []).map((v: any) => ({ variant_id: v.id, amount: seed!.sale!, currency_code: "usd" }))
            ),
          },
        ],
      },
    })
  }

  logger.info("[seed] Demo customer…")
  try {
    const auth = container.resolve(Modules.AUTH)
    const { authIdentity, success } = await auth.register("emailpass", {
      body: { email: "demo@nemaya.store", password: "Nemaya-Demo-2026" },
    } as any)
    if (success && authIdentity) {
      const { result: customer } = await createCustomerAccountWorkflow(container).run({
        input: { authIdentityId: authIdentity.id, customerData: { email: "demo@nemaya.store", first_name: "Ayla", last_name: "Demo" } },
      })
      const profiles = container.resolve<ProfileModuleService>(PROFILE_MODULE)
      await profiles.createForCustomer({ customer_id: customer.id, username: "ayla", avatar_id: "av-07", email: "demo@nemaya.store" })
    }
  } catch (e: any) {
    logger.warn(`[seed] demo customer skipped: ${e.message}`)
  }

  logger.info(`[seed] Done. Region ${region.id}, ${products.length} products.`)
}

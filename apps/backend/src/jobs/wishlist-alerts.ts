import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, getVariantAvailability, QueryContext } from "@medusajs/framework/utils"
import { MESSAGING_MODULE } from "../modules/messaging"
import type MessagingModuleService from "../modules/messaging/service"
import { WISHLIST_MODULE } from "../modules/wishlist"
import type WishlistModuleService from "../modules/wishlist/service"
import { money, notify, storeUrl } from "../lib/notify"

/**
 * Hourly: compares wishlisted products against the price/stock we saw last time
 * and fires "price drop" and "back in stock" alerts (throttled per item).
 */
export default async function wishlistAlerts(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const messaging = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const wishlist = container.resolve<WishlistModuleService>(WISHLIST_MODULE)

  const [priceSetting, stockSetting] = await Promise.all([messaging.getSetting("price_drop"), messaging.getSetting("back_in_stock")])
  if (!priceSetting.enabled && !stockSetting.enabled) return

  const { data: stores } = await query.graph({ entity: "store", fields: ["default_sales_channel_id", "supported_currencies.*"] })
  const salesChannelId = (stores[0] as any)?.default_sales_channel_id
  const currency = ((stores[0] as any)?.supported_currencies ?? []).find((c: any) => c.is_default)?.currency_code ?? "usd"

  const items = (await wishlist.listWishlistItems({}, { take: 5000 })) as any[]
  if (!items.length) return
  const productIds = [...new Set(items.map((i) => i.product_id))]

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "thumbnail", "variants.id", "variants.manage_inventory", "variants.allow_backorder", "variants.calculated_price.*"],
    filters: { id: productIds },
    context: { variants: { calculated_price: QueryContext({ currency_code: currency }) } },
  })
  const byId = Object.fromEntries((products as any[]).map((p) => [p.id, p]))

  const variantIds = (products as any[]).flatMap((p) => (p.variants ?? []).map((v: any) => v.id))
  const availability = salesChannelId && variantIds.length
    ? await getVariantAvailability(query as any, { variant_ids: variantIds, sales_channel_id: salesChannelId })
    : {}

  const variantInStock = (v: any) =>
    !v.manage_inventory || v.allow_backorder || Number(availability[v.id]?.availability ?? 0) > 0

  const throttleOk = (item: any, hours: number) =>
    !item.last_alert_at || Date.now() - new Date(item.last_alert_at).getTime() > hours * 3600_000

  for (const item of items) {
    const product = byId[item.product_id]
    if (!product) continue
    const variants = (product.variants ?? []).filter((v: any) => !item.variant_id || v.id === item.variant_id)
    if (!variants.length) continue

    const price = Math.min(...variants.map((v: any) => Number(v.calculated_price?.calculated_amount ?? Infinity)))
    const inStock = variants.some(variantInStock)
    const path = `/products/${product.handle}`
    const vars = {
      product_title: product.title,
      product_url: `${storeUrl()}${path}`,
      product_path: path,
      image_url: product.thumbnail,
    }
    const update: any = { id: item.id }

    // price drop
    const last = item.last_seen_price != null ? Number(item.last_seen_price) : null
    if (Number.isFinite(price)) {
      const minDrop = Number(priceSetting.config.min_drop_percent ?? 5) / 100
      if (
        priceSetting.enabled &&
        last != null &&
        price < last * (1 - minDrop) &&
        throttleOk(item, Number(priceSetting.config.throttle_hours ?? 24))
      ) {
        await notify(container, {
          type: "price_drop",
          customerId: item.customer_id,
          data: { ...vars, old_price: money(last, currency), new_price: money(price, currency) },
        })
        update.last_alert_at = new Date()
      }
      update.last_seen_price = price
      update.currency_code = currency
    }

    // back in stock
    if (stockSetting.enabled && !item.was_in_stock && inStock && throttleOk(item, Number(stockSetting.config.throttle_hours ?? 24))) {
      await notify(container, { type: "back_in_stock", customerId: item.customer_id, data: vars })
      update.last_alert_at = new Date()
    }
    update.was_in_stock = inStock

    await wishlist.updateWishlistItems(update)
  }
}

export const config = { name: "nemaya-wishlist-alerts", schedule: "0 * * * *" }

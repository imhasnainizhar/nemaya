import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { CART_COOKIE, getToken, medusa, medusaSafe } from "./medusa"
import type { Cart, Customer, GiftCardSummary, InboxMessage, Order, Product, Profile } from "./types"
import { GIFT_CARD_HANDLE } from "./constants"

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.options,*options,*options.values,*images,*categories,*collection,+metadata,+subtitle,+material"

export const getRegion = cache(async () => {
  const res = await medusa<{ regions: any[] }>("/store/regions", { revalidate: 3600, tags: ["regions"], auth: false })
  return res.regions?.[0] ?? null
})

export async function listProducts(params: {
  category_id?: string
  collection_id?: string
  q?: string
  limit?: number
  offset?: number
  order?: string
  id?: string[]
} = {}) {
  const region = await getRegion()
  const res = await medusa<{ products: Product[]; count: number }>("/store/products", {
    auth: false,
    revalidate: 60,
    tags: ["products"],
    query: {
      region_id: region?.id,
      fields: PRODUCT_FIELDS,
      limit: params.limit ?? 24,
      offset: params.offset ?? 0,
      order: params.order,
      q: params.q,
      ...(params.category_id ? { category_id: [params.category_id] } : {}),
      ...(params.collection_id ? { collection_id: [params.collection_id] } : {}),
      ...(params.id?.length ? { id: params.id } : {}),
    },
  })
  // the gift card is sold on its own page
  return { ...res, products: res.products.filter((p) => p.handle !== GIFT_CARD_HANDLE) }
}

export const getProduct = cache(async (handle: string) => {
  const region = await getRegion()
  const res = await medusa<{ products: Product[] }>("/store/products", {
    auth: false,
    revalidate: 60,
    tags: ["products"],
    query: { handle, region_id: region?.id, fields: PRODUCT_FIELDS, limit: 1 },
  })
  return res.products?.[0] ?? null
})

export const listCategories = cache(async () => {
  const res = await medusa<{ product_categories: any[] }>("/store/product-categories", {
    auth: false,
    revalidate: 600,
    query: { fields: "id,name,handle,rank", limit: 50 },
  })
  return res.product_categories ?? []
})

export const listCollections = cache(async () => {
  const res = await medusa<{ collections: any[] }>("/store/collections", { auth: false, revalidate: 600, query: { limit: 50 } })
  return res.collections ?? []
})

const CART_FIELDS =
  "*items,*items.variant,*items.product,+items.metadata,+items.total,+items.subtotal,*region,*shipping_methods,*shipping_address,*billing_address,*payment_collection,*payment_collection.payment_sessions,*promotions,*credit_lines,+credit_line_total,+total,+subtotal,+tax_total,+shipping_total,+discount_total,+item_total,+original_total"

export async function getCartId() {
  return (await cookies()).get(CART_COOKIE)?.value
}

export async function getCart(): Promise<Cart | null> {
  const id = await getCartId()
  if (!id) return null
  const res = await medusaSafe<{ cart: Cart }>(`/store/carts/${id}`, { query: { fields: CART_FIELDS } })
  if (!res?.cart || (res.cart as any).completed_at) return null
  return res.cart
}

export const getCustomer = cache(async (): Promise<Customer | null> => {
  if (!(await getToken())) return null
  const res = await medusaSafe<{ customer: Customer }>("/store/customers/me", { query: { fields: "*addresses" } })
  return res?.customer ?? null
})

export const getProfile = cache(async () => {
  if (!(await getToken())) return null
  return medusaSafe<{ customer: Customer; profile: Profile | null }>("/store/me/profile")
})

export async function listOrders(limit = 20, offset = 0) {
  return medusa<{ orders: Order[]; count: number }>("/store/orders", {
    query: { limit, offset, order: "-created_at", fields: "*items,+total,+display_id,+status,+fulfillment_status,+payment_status,+created_at" },
  })
}

export async function getOrder(id: string) {
  const res = await medusaSafe<{ order: Order }>(`/store/orders/${id}`, {
    query: { fields: "*items,*shipping_address,*shipping_methods,*credit_lines,+total,+subtotal,+tax_total,+shipping_total,+discount_total,+display_id,+status,+fulfillment_status,+payment_status,+email,+created_at" },
  })
  return res?.order ?? null
}

export async function getWishlist() {
  if (!(await getToken())) return { items: [] as { id: string; product_id: string; variant_id: string | null }[] }
  return (await medusaSafe<{ items: { id: string; product_id: string; variant_id: string | null }[] }>("/store/me/wishlist")) ?? { items: [] }
}

export async function getInbox(limit = 20, offset = 0) {
  return (
    (await medusaSafe<{ messages: InboxMessage[]; count: number; unread_count: number }>("/store/me/notifications", { query: { limit, offset } })) ?? {
      messages: [],
      count: 0,
      unread_count: 0,
    }
  )
}

export async function getNotificationPreferences() {
  return medusaSafe<{
    preferences: { marketing_email: boolean; marketing_push: boolean; muted_types: string[] }
    optional_types: { type: string; label: string; description: string }[]
    push_devices: { id: string; user_agent: string | null; created_at: string }[]
  }>("/store/me/notification-preferences")
}

export async function getMyGiftCards() {
  return (await medusaSafe<{ received: GiftCardSummary[]; sent: GiftCardSummary[] }>("/store/me/gift-cards")) ?? { received: [], sent: [] }
}

export async function getGiftCardConfig() {
  return medusaSafe<{ available: boolean; presets: number[]; min: number; max: number; maxPerCart: number }>("/store/nemaya/gift-card-product", {
    auth: false,
    revalidate: 300,
  })
}

export async function getShippingOptions(cartId: string) {
  const res = await medusaSafe<{ shipping_options: any[] }>("/store/shipping-options", { query: { cart_id: cartId } })
  return res?.shipping_options ?? []
}

export async function getPaymentProviders(regionId: string) {
  const res = await medusaSafe<{ payment_providers: { id: string }[] }>("/store/payment-providers", { query: { region_id: regionId } })
  return res?.payment_providers ?? []
}

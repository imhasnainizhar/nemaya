import "server-only"
import { MOCK_CATEGORIES, MOCK_COLLECTIONS, MOCK_PRODUCTS, REGION } from "./catalog"

type Opts = { method?: string; body?: any; query?: Record<string, any> }

class MockError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// carts survive Next dev hot reloads
const g = globalThis as unknown as { __nemayaMockCarts?: Map<string, any> }
const carts = (g.__nemayaMockCarts ??= new Map())
let seq = 0

const SHIPPING = [
  { id: "so_standard", name: "Standard", amount: 8, type: { description: "4–7 business days. Free over $99." } },
  { id: "so_express", name: "Express", amount: 18, type: { description: "1–2 business days." } },
]

function totals(cart: any) {
  const item_total = cart.items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
  for (const i of cart.items) i.total = i.subtotal = i.unit_price * i.quantity
  const method = cart.shipping_methods[0]
  const shipping_total = method ? (method.shipping_option_id === "so_standard" && item_total >= 99 ? 0 : method.base) : 0
  if (method) method.amount = shipping_total
  Object.assign(cart, {
    item_total,
    subtotal: item_total,
    shipping_total,
    tax_total: 0,
    discount_total: 0,
    credit_line_total: 0,
    original_total: item_total + shipping_total,
    total: item_total + shipping_total,
  })
  return cart
}

function findVariant(variantId: string) {
  for (const p of MOCK_PRODUCTS) {
    const v = p.variants.find((x) => x.id === variantId)
    if (v) return { p, v }
  }
  throw new MockError("Variant not found", 404)
}

function arr(v: any): string[] {
  return v === undefined ? [] : Array.isArray(v) ? v.map(String) : [String(v)]
}

export async function mockMedusa<T>(path: string, opts: Opts = {}): Promise<T> {
  const method = opts.method ?? "GET"
  const q = opts.query ?? {}
  const seg = path.split("?")[0].split("/").filter(Boolean) // ["store", ...]

  if (path === "/store/regions") return { regions: [REGION] } as T
  if (path === "/store/product-categories") return { product_categories: MOCK_CATEGORIES } as T
  if (path === "/store/collections") return { collections: MOCK_COLLECTIONS } as T

  if (path === "/store/products") {
    let list = [...MOCK_PRODUCTS]
    if (q.handle) list = list.filter((p) => p.handle === q.handle)
    const ids = arr(q.id)
    if (ids.length) list = list.filter((p) => ids.includes(p.id))
    const cats = arr(q.category_id)
    if (cats.length) list = list.filter((p) => p.categories.some((c) => cats.includes(c.id)))
    const cols = arr(q.collection_id)
    if (cols.length) list = list.filter((p) => p.collection && cols.includes(p.collection.id))
    if (q.q) {
      const term = String(q.q).toLowerCase()
      list = list.filter((p) => `${p.title} ${p.description} ${p.categories[0].name} ${p.collection?.title ?? ""}`.toLowerCase().includes(term))
    }
    if (q.order === "-created_at") list.sort((a, b) => b.created_at.localeCompare(a.created_at))
    const offset = Number(q.offset ?? 0)
    const limit = Number(q.limit ?? 50)
    return { products: list.slice(offset, offset + limit), count: list.length } as T
  }

  if (path === "/store/shipping-options") return { shipping_options: SHIPPING } as T
  if (path === "/store/payment-providers") return { payment_providers: [{ id: "pp_system_default" }] } as T

  // ---- carts
  if (seg[1] === "carts") {
    if (seg.length === 2 && method === "POST") {
      const id = `cart_mock_${Date.now().toString(36)}${seq++}`
      carts.set(id, totals({ id, region_id: REGION.id, region: REGION, currency_code: "usd", items: [], shipping_methods: [], credit_lines: [], promotions: [], email: null }))
      return { cart: carts.get(id) } as T
    }
    const cart = carts.get(seg[2])
    if (!cart) throw new MockError("Cart not found", 404)

    if (seg.length === 3) {
      if (method === "POST") Object.assign(cart, opts.body ?? {})
      return { cart: totals(cart) } as T
    }
    if (seg[3] === "line-items") {
      if (seg.length === 4 && method === "POST") {
        const { p, v } = findVariant(opts.body.variant_id)
        const existing = cart.items.find((i: any) => i.variant_id === v.id)
        if (existing) existing.quantity += Number(opts.body.quantity ?? 1)
        else
          cart.items.push({
            id: `item_${seq++}`,
            variant_id: v.id,
            product_id: p.id,
            product_handle: p.handle,
            product_title: p.title,
            title: p.title,
            variant_title: v.title,
            thumbnail: v.metadata.image,
            quantity: Number(opts.body.quantity ?? 1),
            unit_price: v.calculated_price.calculated_amount,
            compare_at_unit_price: v.calculated_price.original_amount,
            requires_shipping: true,
            metadata: {},
            created_at: new Date().toISOString(),
          })
        return { cart: totals(cart) } as T
      }
      const item = cart.items.find((i: any) => i.id === seg[4])
      if (!item) throw new MockError("Line item not found", 404)
      if (method === "DELETE") cart.items = cart.items.filter((i: any) => i !== item)
      else item.quantity = Number(opts.body?.quantity ?? item.quantity)
      return { cart: totals(cart) } as T
    }
    if (seg[3] === "shipping-methods") {
      const o = SHIPPING.find((s) => s.id === opts.body?.option_id)!
      cart.shipping_methods = [{ id: "sm_mock", shipping_option_id: o.id, name: o.name, base: o.amount, amount: o.amount }]
      return { cart: totals(cart) } as T
    }
    if (seg[3] === "gift-cards") return { cart: totals(cart) } as T
    if (seg[3] === "promotions") throw new MockError("Promo codes need the real backend.", 400)
    if (seg[3] === "complete") throw new MockError("Checkout needs the real backend (mock mode).", 400)
  }

  if (path === "/store/nemaya/gift-card-product") return { available: false, presets: [25, 50, 100, 200], min: 10, max: 500, maxPerCart: 3 } as T

  // everything account-related behaves like a signed-out shopper
  if (path.startsWith("/store/me") || path.startsWith("/store/customers") || path.startsWith("/auth") || path.startsWith("/store/orders")) {
    throw new MockError("Sign-in isn't available in mock mode.", 401)
  }
  throw new MockError(`Mock mode doesn't implement ${method} ${path}`, 501)
}

import type { Product } from "./types"
import { productPrice } from "@/components/price"

/** Lightweight per-product facts used for filtering (server) and live result counts (filter sheet). */
export type ProductFacts = {
  id: string
  price: number
  onSale: boolean
  inStock: boolean
  colors: string[]
  sizes: string[]
  category: string | null
}

export type Filters = {
  sort: "newest" | "price-asc" | "price-desc" | "name"
  avail: "" | "in" | "out"
  min: number | null
  max: number | null
  colors: string[]
  sizes: string[]
  category: string
  sale: boolean
  q: string
  page: number
}

export type Facets = {
  priceMin: number
  priceMax: number
  colors: { value: string; hex: string; count: number }[]
  sizes: { value: string; count: number }[]
  categories: { handle: string; name: string; count: number }[]
  availability: { in: number; out: number }
}

export const PAGE_SIZE = 12
export const SORTS: { value: Filters["sort"]; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "name", label: "Alphabetical" },
]

const list = (v?: string | string[]) => (Array.isArray(v) ? v.join(",") : v ?? "").split(",").map((s) => s.trim()).filter(Boolean)
const num = (v?: string | string[]) => {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isFinite(n) && v !== undefined && v !== "" ? n : null
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const s = String(sp.sort ?? "newest")
  return {
    sort: (SORTS.some((x) => x.value === s) ? s : "newest") as Filters["sort"],
    avail: sp.avail === "in" || sp.avail === "out" ? sp.avail : "",
    min: num(sp.min),
    max: num(sp.max),
    colors: list(sp.color),
    sizes: list(sp.size),
    category: String(sp.category ?? ""),
    sale: sp.sale === "1",
    q: String(sp.q ?? "").slice(0, 80),
    page: Math.max(1, Number(sp.page) || 1),
  }
}

const vOpt = (v: any, title: string) => v.options?.find((o: any) => o.option?.title === title)?.value as string | undefined
const vInStock = (v: any) => !v?.manage_inventory || v?.allow_backorder || Number(v?.inventory_quantity ?? 0) > 0

export function factsOf(p: Product): ProductFacts {
  const price = productPrice(p)
  const variants = p.variants ?? []
  return {
    id: p.id,
    price: price?.current ?? 0,
    onSale: !!price?.onSale,
    inStock: variants.some(vInStock),
    colors: p.options?.find((o) => o.title === "Color")?.values?.map((v) => v.value) ?? [],
    // sizes that are actually available somewhere
    sizes: [...new Set(variants.filter(vInStock).map((v) => vOpt(v, "Size")).filter(Boolean) as string[])],
    category: p.categories?.[0]?.handle ?? null,
  }
}

/** Does a product pass the filters? (`skip` lets facet counts ignore their own dimension.) */
export function matches(f: ProductFacts, filters: Filters, skip?: keyof Filters) {
  if (skip !== "sale" && filters.sale && !f.onSale) return false
  if (skip !== "avail" && filters.avail === "in" && !f.inStock) return false
  if (skip !== "avail" && filters.avail === "out" && f.inStock) return false
  if (skip !== "min" && filters.min !== null && f.price < filters.min) return false
  if (skip !== "max" && filters.max !== null && f.price > filters.max) return false
  if (skip !== "colors" && filters.colors.length && !filters.colors.some((c) => f.colors.includes(c))) return false
  if (skip !== "sizes" && filters.sizes.length && !filters.sizes.some((s) => f.sizes.includes(s))) return false
  if (skip !== "category" && filters.category && f.category !== filters.category) return false
  return true
}

export function buildFacets(products: Product[], filters: Filters, categoryNames: Record<string, string>): Facets {
  const facts = products.map(factsOf)
  const prices = facts.map((f) => f.price)
  const colorHexes: Record<string, string> = {}
  for (const p of products) Object.assign(colorHexes, (p.metadata?.colors ?? {}) as Record<string, string>)

  const count = <K extends string>(skip: keyof Filters, key: (f: ProductFacts) => K[]) => {
    const m = new Map<K, number>()
    for (const f of facts) {
      if (!matches(f, filters, skip)) continue
      for (const k of key(f)) m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }
  const colors = count("colors", (f) => f.colors)
  const sizes = count("sizes", (f) => f.sizes)
  const cats = count("category", (f) => (f.category ? [f.category] : []))
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "One size"]

  return {
    priceMin: prices.length ? Math.floor(Math.min(...prices)) : 0,
    priceMax: Math.ceil(prices.length ? Math.max(...prices) : 0),
    colors: [...new Set(facts.flatMap((f) => f.colors))].map((value) => ({ value, hex: colorHexes[value] ?? "#d9cbb4", count: colors.get(value) ?? 0 })),
    sizes: [...new Set(facts.flatMap((f) => f.sizes))]
      .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b))
      .map((value) => ({ value, count: sizes.get(value) ?? 0 })),
    categories: [...new Set(facts.map((f) => f.category).filter(Boolean) as string[])].map((handle) => ({
      handle,
      name: categoryNames[handle] ?? handle,
      count: cats.get(handle) ?? 0,
    })),
    availability: {
      in: facts.filter((f) => f.inStock && matches(f, filters, "avail")).length,
      out: facts.filter((f) => !f.inStock && matches(f, filters, "avail")).length,
    },
  }
}

export function applyFilters(products: Product[], filters: Filters) {
  const out = products.filter((p) => matches(factsOf(p), filters))
  const price = (p: Product) => productPrice(p)?.current ?? 0
  if (filters.sort === "price-asc") out.sort((a, b) => price(a) - price(b))
  if (filters.sort === "price-desc") out.sort((a, b) => price(b) - price(a))
  if (filters.sort === "name") out.sort((a, b) => a.title.localeCompare(b.title))
  return out
}

export function activeFilterCount(f: Filters) {
  return (f.avail ? 1 : 0) + (f.min !== null || f.max !== null ? 1 : 0) + f.colors.length + f.sizes.length + (f.sale ? 1 : 0)
}

/** Serialise filters back to a query string (drops defaults). */
export function toQuery(f: Partial<Filters>, extra: Record<string, string> = {}) {
  const p = new URLSearchParams()
  if (f.q) p.set("q", f.q)
  if (f.category) p.set("category", f.category)
  if (f.sale) p.set("sale", "1")
  if (f.avail) p.set("avail", f.avail)
  if (f.min !== null && f.min !== undefined) p.set("min", String(f.min))
  if (f.max !== null && f.max !== undefined) p.set("max", String(f.max))
  if (f.colors?.length) p.set("color", f.colors.join(","))
  if (f.sizes?.length) p.set("size", f.sizes.join(","))
  if (f.sort && f.sort !== "newest") p.set("sort", f.sort)
  if (f.page && f.page > 1) p.set("page", String(f.page))
  for (const [k, v] of Object.entries(extra)) p.set(k, v)
  const s = p.toString()
  return s ? `?${s}` : ""
}

import "server-only"
import { cache } from "react"
import { listCategories, listCollections, listProducts } from "./data"
import { productPrice } from "@/components/price"

export type NavProduct = { id: string; title: string; handle: string; thumbnail: string | null; price: number; original: number; currency: string }
export type NavCategory = { id: string; name: string; handle: string; blurb: string; thumbnail: string | null; count: number }
export type NavCollection = { id: string; title: string; handle: string; description: string; thumbnails: string[]; count: number }
export type NavData = { categories: NavCategory[]; collections: NavCollection[]; featured: NavProduct[]; sale: NavProduct[] }

const toNav = (p: any): NavProduct => {
  const price = productPrice(p)
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    thumbnail: p.thumbnail,
    price: price?.current ?? 0,
    original: price?.original ?? 0,
    currency: price?.currency ?? "usd",
  }
}

/** Everything the header needs for the mega menu, mobile menu and empty search state. */
export const getNavData = cache(async (): Promise<NavData> => {
  const [categories, collections, { products }] = await Promise.all([
    listCategories().catch(() => []),
    listCollections().catch(() => []),
    listProducts({ limit: 100, order: "-created_at" }).catch(() => ({ products: [] as any[] })),
  ])

  return {
    categories: categories.map((c: any) => {
      const inCat = products.filter((p: any) => p.categories?.some((x: any) => x.id === c.id))
      return { id: c.id, name: c.name, handle: c.handle, blurb: c.description ?? "", thumbnail: inCat[0]?.thumbnail ?? null, count: inCat.length }
    }),
    collections: collections.map((c: any) => {
      const inCol = products.filter((p: any) => p.collection?.id === c.id)
      return {
        id: c.id,
        title: c.title,
        handle: c.handle,
        description: (c.metadata?.description as string) ?? "",
        thumbnails: inCol.slice(0, 3).map((p: any) => p.thumbnail).filter(Boolean),
        count: inCol.length,
      }
    }),
    featured: products.slice(0, 4).map(toNav),
    sale: products.filter((p: any) => productPrice(p)?.onSale).slice(0, 4).map(toNav),
  }
})

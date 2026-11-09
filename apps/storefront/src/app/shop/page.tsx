import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getWishlist, listProducts } from "@/lib/data"
import { getNavData } from "@/lib/nav"
import { parseFilters } from "@/lib/catalog"
import { CatalogView } from "@/components/catalog/catalog-view"

export const metadata: Metadata = { title: "Shop" }

type SP = Promise<Record<string, string | string[] | undefined>>

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  // old-style links → the dedicated collection page
  if (typeof sp.collection === "string" && sp.collection) redirect(`/collections/${sp.collection}`)

  const filters = parseFilters(sp)
  const [nav, wishlist, { products }] = await Promise.all([getNavData(), getWishlist(), listProducts({ limit: 200, order: "-created_at", q: filters.q || undefined })])
  const category = nav.categories.find((c) => c.handle === filters.category)

  const title = filters.q ? `“${filters.q}”` : filters.sale ? "On sale" : category?.name ?? "Shop all"
  const crumbs = [{ label: "Shop", href: "/shop" }, ...(category || filters.q || filters.sale ? [{ label: filters.q ? "Search" : title }] : [])]

  return (
    <CatalogView
      basePath="/shop"
      title={title}
      crumbs={crumbs}
      description={category?.blurb ?? (filters.q ? `Search results for “${filters.q}”.` : "Heavyweight basics and outerwear in colours borrowed from the earth.")}
      products={products}
      filters={filters}
      categories={nav.categories}
      saved={new Set(wishlist.items.map((i) => i.product_id))}
      tone={filters.sale ? "clay" : "bark"}
    />
  )
}

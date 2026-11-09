import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getWishlist, listProducts } from "@/lib/data"
import { getNavData } from "@/lib/nav"
import { parseFilters } from "@/lib/catalog"
import { CatalogView } from "@/components/catalog/catalog-view"

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [nav, { handle }] = await Promise.all([getNavData(), params])
  const c = nav.collections.find((x) => x.handle === handle)
  return c ? { title: c.title, description: c.description } : {}
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ handle }, sp, nav] = await Promise.all([params, searchParams, getNavData()])
  const collection = nav.collections.find((c) => c.handle === handle)
  if (!collection) notFound()

  const filters = parseFilters(sp)
  const [wishlist, { products }] = await Promise.all([getWishlist(), listProducts({ limit: 200, order: "-created_at", collection_id: collection.id })])

  return (
    <CatalogView
      basePath={`/collections/${handle}`}
      title={collection.title}
      crumbs={[{ label: "Collections", href: "/collections" }, { label: collection.title }]}
      description={collection.description}
      products={products}
      filters={filters}
      categories={nav.categories}
      saved={new Set(wishlist.items.map((i) => i.product_id))}
      tone="moss"
      showStrip={false}
    />
  )
}

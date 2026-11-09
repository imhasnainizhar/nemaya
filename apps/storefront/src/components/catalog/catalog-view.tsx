import Link from "next/link"
import { SearchX } from "lucide-react"
import type { Product } from "@/lib/types"
import type { NavCategory } from "@/lib/nav"
import { activeFilterCount, applyFilters, buildFacets, factsOf, PAGE_SIZE, toQuery, type Filters } from "@/lib/catalog"
import { ProductCard } from "@/components/product-card"
import { CatalogBanner, type Crumb } from "./catalog-banner"
import { CategoryStrip } from "./category-strip"
import { CatalogToolbar } from "./catalog-toolbar"

/** Shared layout for /shop (catalog) and /collections/[handle]. */
export function CatalogView({
  basePath,
  title,
  crumbs,
  description,
  products,
  filters,
  categories,
  saved,
  tone,
  showStrip = true,
}: {
  basePath: string
  title: string
  crumbs: Crumb[]
  description?: string
  products: Product[]
  filters: Filters
  categories: NavCategory[]
  saved: Set<string>
  tone?: "bark" | "moss" | "clay"
  showStrip?: boolean
}) {
  const names = Object.fromEntries(categories.map((c) => [c.handle, c.name]))
  const facets = buildFacets(products, filters, names)
  const filtered = applyFilters(products, filters)
  const shown = filtered.slice(0, filters.page * PAGE_SIZE)
  const bannerImages = products.slice(0, 3).map((p) => p.thumbnail).filter(Boolean) as string[]

  return (
    <div>
      <CatalogBanner title={title} crumbs={crumbs} description={description} images={bannerImages} tone={tone} />
      {showStrip && <CategoryStrip categories={categories} active={filters.category} basePath={basePath} />}

      <CatalogToolbar
        basePath={basePath}
        filters={filters}
        facets={facets}
        facts={products.map(factsOf)}
        total={filtered.length}
        activeCount={activeFilterCount(filters)}
        hideCategory={showStrip}
      />

      <div className="container-x pt-8">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <SearchX className="mx-auto h-10 w-10 text-stone" strokeWidth={1.4} />
            <p className="font-display mt-4 text-3xl">Nothing matches those filters</p>
            <p className="mt-2 text-stone">Try removing a filter or two.</p>
            <Link href={`${basePath}${toQuery({ q: filters.q, category: filters.category })}`} className="btn-primary mt-6">Clear filters</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {shown.map((p, i) => (
                <ProductCard key={p.id} product={p} saved={saved.has(p.id)} priority={i < 4} />
              ))}
            </div>
            {shown.length < filtered.length && (
              <div className="mt-14 flex flex-col items-center gap-3">
                <p className="text-xs text-stone">Showing {shown.length} of {filtered.length}</p>
                <div className="h-1 w-48 overflow-hidden rounded-full bg-sand">
                  <div className="h-full bg-bark" style={{ width: `${(shown.length / filtered.length) * 100}%` }} />
                </div>
                <Link href={`${basePath}${toQuery({ ...filters, page: filters.page + 1 })}`} scroll={false} className="btn-ghost mt-2">
                  Load more
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

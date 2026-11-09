"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownUp, Check, SlidersHorizontal, X } from "lucide-react"
import { SORTS, toQuery, type Facets, type Filters, type ProductFacts } from "@/lib/catalog"
import { useDismiss } from "@/components/ui/use-dismiss"
import { cn, formatMoney } from "@/lib/util"
import { FilterSheet } from "./filter-sheet"

export function CatalogToolbar({
  basePath,
  filters,
  facets,
  facts,
  total,
  activeCount,
  hideCategory = false,
}: {
  basePath: string
  filters: Filters
  facets: Facets
  facts: ProductFacts[]
  total: number
  activeCount: number
  hideCategory?: boolean
}) {
  const router = useRouter()
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  useDismiss(sortRef, sortOpen, () => setSortOpen(false))

  const go = (patch: Partial<Filters>) => router.push(`${basePath}${toQuery({ ...filters, page: 1, ...patch })}`, { scroll: false })

  // removable chips for every active filter
  const chips: { label: string; patch: Partial<Filters> }[] = [
    ...(filters.sale ? [{ label: "On sale", patch: { sale: false } }] : []),
    ...(filters.avail ? [{ label: filters.avail === "in" ? "In stock" : "Out of stock", patch: { avail: "" as const } }] : []),
    ...(filters.min !== null || filters.max !== null
      ? [{ label: `${formatMoney(filters.min ?? facets.priceMin)} – ${formatMoney(filters.max ?? facets.priceMax)}`, patch: { min: null, max: null } }]
      : []),
    ...filters.colors.map((c) => ({ label: c, patch: { colors: filters.colors.filter((x) => x !== c) } })),
    ...filters.sizes.map((s) => ({ label: `Size ${s}`, patch: { sizes: filters.sizes.filter((x) => x !== s) } })),
  ]

  return (
    <>
      <div className="sticky top-[var(--header-h,101px)] z-30 mt-6 border-y border-bark/10 bg-linen/90 backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between gap-3">
          <button onClick={() => setFilterOpen(true)} className="chip gap-2 bg-paper px-5 font-semibold shadow-sm">
            Filter
            {activeCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-bark px-1 text-[10px] text-linen">{activeCount}</span>
            ) : (
              <SlidersHorizontal className="h-4 w-4" />
            )}
          </button>

          <p className="text-xs text-bark-soft" aria-live="polite">
            {total} {total === 1 ? "product" : "products"}
          </p>

          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              className="chip gap-2 bg-paper px-5 font-semibold shadow-sm"
            >
              <span className="hidden sm:inline">Sort:</span> {SORTS.find((s) => s.value === filters.sort)?.label.split(",")[0]}
              <ArrowDownUp className="h-4 w-4" />
            </button>
            {sortOpen && (
              <ul role="listbox" aria-label="Sort products" className="card absolute right-0 mt-2 w-60 overflow-hidden p-1.5 shadow-xl shadow-bark/10 animate-rise">
                {SORTS.map((s) => (
                  <li key={s.value}>
                    <button
                      role="option"
                      aria-selected={filters.sort === s.value}
                      onClick={() => {
                        setSortOpen(false)
                        go({ sort: s.value })
                      }}
                      className={cn("flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition hover:bg-sand", filters.sort === s.value && "font-semibold")}
                    >
                      {s.label}
                      {filters.sort === s.value && <Check className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {chips.length > 0 && (
          <div className="container-x flex flex-wrap items-center gap-2 pb-3">
            {chips.map((c) => (
              <button key={c.label} onClick={() => go(c.patch)} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-xs font-medium hover:bg-sand-deep">
                {c.label} <X className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={() => go({ sale: false, avail: "", min: null, max: null, colors: [], sizes: [] })}
              className="text-xs font-semibold underline underline-offset-4"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        facets={facets}
        facts={facts}
        hideCategory={hideCategory}
        onApply={(next) => {
          setFilterOpen(false)
          go(next)
        }}
      />
    </>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Check } from "lucide-react"
import { matches, type Facets, type Filters, type ProductFacts } from "@/lib/catalog"
import { Sheet } from "@/components/ui/sheet"
import { cn, formatMoney } from "@/lib/util"

/** Filter drawer: availability, price range, colour, size, category — with a live result count. */
export function FilterSheet({
  open,
  onClose,
  filters,
  facets,
  facts,
  hideCategory,
  onApply,
}: {
  open: boolean
  onClose: () => void
  filters: Filters
  facets: Facets
  facts: ProductFacts[]
  hideCategory: boolean
  onApply: (next: Partial<Filters>) => void
}) {
  const [draft, setDraft] = useState<Filters>(filters)
  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  const lo = facets.priceMin
  const hi = Math.max(facets.priceMax, lo + 1)
  const min = draft.min ?? lo
  const max = draft.max ?? hi
  const resultCount = useMemo(() => facts.filter((f) => matches(f, draft)).length, [facts, draft])

  const toggle = (key: "colors" | "sizes", v: string) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }))

  const clear = () => setDraft({ ...draft, avail: "", min: null, max: null, colors: [], sizes: [], sale: false, category: hideCategory ? draft.category : "" })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      anchor="right"
      desktopWidth={480}
      footer={
        <div className="flex items-center gap-3">
          <button onClick={clear} className="px-2 text-sm font-semibold underline underline-offset-4">Clear all</button>
          <button
            onClick={() =>
              onApply({
                avail: draft.avail,
                min: draft.min !== null && draft.min > lo ? draft.min : null,
                max: draft.max !== null && draft.max < hi ? draft.max : null,
                colors: draft.colors,
                sizes: draft.sizes,
                sale: draft.sale,
                category: draft.category,
              })
            }
            className="btn-primary flex-1 py-3.5"
          >
            Show {resultCount} {resultCount === 1 ? "product" : "products"}
          </button>
        </div>
      }
    >
      <div className="ny-reveal divide-y divide-bark/10 px-5 sm:px-7" style={{ ["--d" as any]: "0.25s" }}>
        <Group title="Availability">
          {(["in", "out"] as const).map((a) => {
            const n = a === "in" ? facets.availability.in : facets.availability.out
            return (
              <Check2
                key={a}
                checked={draft.avail === a}
                disabled={n === 0 && draft.avail !== a}
                onChange={() => setDraft((d) => ({ ...d, avail: d.avail === a ? "" : a }))}
                label={a === "in" ? "In stock" : "Out of stock"}
                count={n}
              />
            )
          })}
          <Check2 checked={draft.sale} onChange={() => setDraft((d) => ({ ...d, sale: !d.sale }))} label="On sale" />
        </Group>

        <Group title="Price">
          <div className="flex justify-between text-sm">
            <span className="rounded-full bg-sand px-3 py-1">{formatMoney(min)}</span>
            <span className="rounded-full bg-sand px-3 py-1">{formatMoney(max)}</span>
          </div>
          <div className="relative mt-5 h-6">
            <div className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-sand-deep" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-bark"
              style={{ left: `${((min - lo) / (hi - lo)) * 100}%`, right: `${100 - ((max - lo) / (hi - lo)) * 100}%` }}
            />
            <input
              type="range"
              aria-label="Minimum price"
              min={lo}
              max={hi}
              value={min}
              onChange={(e) => setDraft((d) => ({ ...d, min: Math.min(Number(e.target.value), max - 1) }))}
              className="range-thumb absolute inset-0 w-full"
            />
            <input
              type="range"
              aria-label="Maximum price"
              min={lo}
              max={hi}
              value={max}
              onChange={(e) => setDraft((d) => ({ ...d, max: Math.max(Number(e.target.value), min + 1) }))}
              className="range-thumb absolute inset-0 w-full"
            />
          </div>
        </Group>

        {facets.colors.length > 0 && (
          <Group title="Colour">
            <div className="flex flex-wrap gap-2">
              {facets.colors.map((c) => {
                const on = draft.colors.includes(c.value)
                return (
                  <button
                    key={c.value}
                    onClick={() => toggle("colors", c.value)}
                    aria-pressed={on}
                    disabled={c.count === 0 && !on}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm transition disabled:opacity-40",
                      on ? "border-bark bg-bark text-linen" : "border-bark/15 hover:border-bark/40"
                    )}
                  >
                    <span className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
                    {c.value} <span className={cn("text-xs", on ? "text-linen/70" : "text-stone")}>{c.count}</span>
                  </button>
                )
              })}
            </div>
          </Group>
        )}

        {facets.sizes.length > 0 && (
          <Group title="Size">
            <div className="flex flex-wrap gap-2">
              {facets.sizes.map((s) => {
                const on = draft.sizes.includes(s.value)
                return (
                  <button
                    key={s.value}
                    onClick={() => toggle("sizes", s.value)}
                    aria-pressed={on}
                    disabled={s.count === 0 && !on}
                    className={cn(
                      "min-w-[52px] rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition disabled:opacity-40",
                      on ? "border-bark bg-bark text-linen" : "border-bark/15 hover:border-bark/40"
                    )}
                  >
                    {s.value}
                  </button>
                )
              })}
            </div>
          </Group>
        )}

        {!hideCategory && facets.categories.length > 1 && (
          <Group title="Category">
            {facets.categories.map((c) => (
              <Check2
                key={c.handle}
                checked={draft.category === c.handle}
                onChange={() => setDraft((d) => ({ ...d, category: d.category === c.handle ? "" : c.handle }))}
                label={c.name}
                count={c.count}
              />
            ))}
          </Group>
        )}
      </div>
    </Sheet>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="py-6">
      <legend className="float-left mb-4 w-full font-display text-xl">{title}</legend>
      <div className="clear-both space-y-2.5">{children}</div>
    </fieldset>
  )
}

function Check2({ checked, onChange, label, count, disabled }: { checked: boolean; onChange: () => void; label: string; count?: number; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3 text-sm", disabled && "cursor-not-allowed opacity-40")}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} disabled={disabled} />
      <span className={cn("grid h-5 w-5 place-items-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-clay", checked ? "border-bark bg-bark text-linen" : "border-bark/25 bg-paper")}>
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>
      {label}
      {count !== undefined && <span className="text-stone">({count})</span>}
    </label>
  )
}

"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { Check, Loader2, Plus, ShoppingBag } from "lucide-react"
import { addToCartAction } from "@/lib/actions"
import type { Product } from "@/lib/types"
import { useUI } from "@/components/ui/ui-provider"
import { useDismiss } from "@/components/ui/use-dismiss"
import { cn, colorHex } from "@/lib/util"

const optionValue = (v: any, title: string) => v.options?.find((o: any) => o.option?.title === title)?.value as string | undefined
const inStock = (v: any) => !v?.manage_inventory || v?.allow_backorder || Number(v?.inventory_quantity ?? 0) > 0

/**
 * Quick-add popover: pick colour + size without leaving the grid / search results,
 * then the cart drawer slides open.
 */
export function QuickAdd({
  product,
  className,
  align = "right",
  size = "md",
  placement = "top",
}: {
  product: Product
  className?: string
  align?: "right" | "left"
  size?: "sm" | "md"
  /** "side" opens to the left, vertically centred — for rows inside scrolling panels */
  placement?: "top" | "side"
}) {
  const ui = useUI()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, open, () => setOpen(false))

  const colors = product.options?.find((o) => o.title === "Color")?.values?.map((v) => v.value) ?? []
  const sizes = product.options?.find((o) => o.title === "Size")?.values?.map((v) => v.value) ?? []
  const [color, setColor] = useState(colors[0] ?? "")

  const variants = useMemo(() => product.variants ?? [], [product.variants])
  const single = variants.length === 1

  const add = (variantId: string) =>
    start(async () => {
      setError(null)
      const res = await addToCartAction(variantId, 1)
      if (res?.error) return setError(res.error)
      setOpen(false)
      await ui.showCart()
    })

  const onTrigger = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (single) return add(variants[0].id)
    setOpen((o) => !o)
  }

  return (
    <div ref={ref} className={cn("relative", className)} onClick={(e) => e.preventDefault()}>
      <button
        type="button"
        onClick={onTrigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Quick add ${product.title}`}
        className={cn(
          "grid place-items-center rounded-full bg-paper/95 text-bark shadow-sm ring-1 ring-bark/10 backdrop-blur transition hover:bg-bark hover:text-linen",
          size === "sm" ? "h-9 w-9" : "h-10 w-10"
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : open ? <Plus className="h-4 w-4 rotate-45 transition" /> : <ShoppingBag className="h-4 w-4" strokeWidth={1.7} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Choose options for ${product.title}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "card absolute z-30 w-[244px] p-4 text-left shadow-xl shadow-bark/15 animate-rise",
            placement === "side" ? "top-1/2 right-12 -translate-y-1/2" : cn("bottom-12", align === "right" ? "right-0" : "left-0")
          )}
        >
          <p className="truncate text-sm font-semibold">{product.title}</p>
          {colors.length > 1 && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] font-semibold tracking-wide text-stone uppercase">Colour · {color}</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={color === c}
                    onClick={(e) => {
                      e.preventDefault()
                      setColor(c)
                    }}
                    className={cn("h-7 w-7 rounded-full transition", color === c ? "ring-2 ring-bark ring-offset-2 ring-offset-paper" : "ring-1 ring-bark/15")}
                    style={{ background: colorHex(product, c) }}
                  />
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 mb-2 text-[11px] font-semibold tracking-wide text-stone uppercase">Add size</p>
          <div className="grid grid-cols-3 gap-1.5">
            {sizes.map((s) => {
              const v = variants.find((x) => (!colors.length || optionValue(x, "Color") === color) && optionValue(x, "Size") === s)
              const ok = !!v && inStock(v)
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok || pending}
                  onClick={(e) => {
                    e.preventDefault()
                    v && add(v.id)
                  }}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-xs font-semibold transition",
                    ok ? "border-bark/15 hover:border-bark hover:bg-bark hover:text-linen" : "cursor-not-allowed border-transparent bg-sand/60 text-stone line-through"
                  )}
                >
                  {s}
                </button>
              )
            })}
          </div>
          {error && <p className="mt-2 text-xs text-clay">{error}</p>}
          <p className="mt-3 flex items-center gap-1 text-[11px] text-stone">
            <Check className="h-3 w-3" /> Opens your cart after adding
          </p>
        </div>
      )}
    </div>
  )
}

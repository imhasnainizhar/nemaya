import type { Product, Variant } from "@/lib/types"
import { cn, formatMoney } from "@/lib/util"

export function variantPrice(v?: Variant | null) {
  const cp: any = (v as any)?.calculated_price
  if (!cp) return null
  const current = Number(cp.calculated_amount)
  const original = Number(cp.original_amount)
  return { current, original, currency: cp.currency_code ?? "usd", onSale: original > current }
}

export function productPrice(p: Product) {
  const prices = (p.variants ?? []).map(variantPrice).filter(Boolean) as NonNullable<ReturnType<typeof variantPrice>>[]
  if (!prices.length) return null
  return prices.reduce((min, x) => (x.current < min.current ? x : min), prices[0])
}

export function Price({
  price,
  size = "sm",
  className,
}: {
  price: ReturnType<typeof variantPrice>
  size?: "sm" | "lg"
  className?: string
}) {
  if (!price) return null
  const pct = price.onSale ? Math.round((1 - price.current / price.original) * 100) : 0
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-semibold", size === "lg" ? "font-display text-3xl font-medium" : "text-sm")}>
        {formatMoney(price.current, price.currency)}
      </span>
      {price.onSale && (
        <>
          <span className={cn("text-stone line-through", size === "lg" ? "text-lg" : "text-xs")}>{formatMoney(price.original, price.currency)}</span>
          {size === "lg" && <span className="rounded-full bg-clay px-2.5 py-1 text-[11px] font-bold tracking-wide text-linen">{pct}% OFF</span>}
        </>
      )}
    </span>
  )
}

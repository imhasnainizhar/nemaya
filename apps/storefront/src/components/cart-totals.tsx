import type { Cart } from "@/lib/types"
import { formatMoney } from "@/lib/util"

export function CartTotals({ cart, showShipping = false }: { cart: Cart; showShipping?: boolean }) {
  const c = cart.currency_code
  const giftCards = (cart.credit_lines ?? []).filter((l) => l.reference === "gift_card")
  const rows: [string, number, string?][] = [["Subtotal", Number(cart.item_total ?? cart.subtotal ?? 0)]]
  if (Number(cart.discount_total) > 0) rows.push(["Discount", -Number(cart.discount_total), "text-moss"])
  if (showShipping || Number(cart.shipping_total) > 0) rows.push(["Shipping", Number(cart.shipping_total ?? 0)])
  if (Number(cart.tax_total) > 0) rows.push(["Taxes", Number(cart.tax_total)])
  for (const g of giftCards) rows.push([`Gift card ${g.metadata?.code_masked ?? ""}`, -Number(g.amount), "text-moss"])

  return (
    <dl className="mt-5 space-y-2.5 text-sm">
      {rows.map(([label, v, cls]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-bark-soft">{label}</dt>
          <dd className={cls}>{v < 0 ? `−${formatMoney(-v, c)}` : label === "Shipping" && v === 0 && cart.shipping_methods?.length ? "Free" : formatMoney(v, c)}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-bark/10 pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd>{formatMoney(cart.total, c)}</dd>
      </div>
    </dl>
  )
}

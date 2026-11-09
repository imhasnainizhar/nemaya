import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { getCustomer, getOrder } from "@/lib/data"
import { formatMoney } from "@/lib/util"

export const dynamic = "force-dynamic"

export default async function OrderConfirmed({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [order, customer] = await Promise.all([getOrder(id), getCustomer()])
  if (!order) notFound()
  const c = order.currency_code
  const giftCards = ((order as any).credit_lines ?? []).filter((l: any) => l.reference === "gift_card")

  return (
    <div className="container-x max-w-3xl pt-16">
      <div className="text-center animate-rise">
        <CheckCircle2 className="mx-auto h-14 w-14 text-moss" strokeWidth={1.4} />
        <h1 className="font-display mt-6 text-5xl tracking-tight">Thank you!</h1>
        <p className="mt-3 text-bark-soft">
          Order <span className="font-semibold text-bark">#{order.display_id}</span> is confirmed. A receipt is on its way to {order.email}.
        </p>
        <p className="mt-2 text-xs text-stone">Portfolio demo — this order was paid in test mode and won’t ship.</p>
      </div>

      <div className="card mt-12 p-6 sm:p-8">
        <ul className="divide-y divide-bark/10">
          {order.items?.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-4">
              <span className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                {i.thumbnail && <Image src={i.thumbnail} alt="" fill sizes="56px" unoptimized={i.thumbnail.endsWith(".svg")} className="object-cover" />}
              </span>
              <span className="flex-1 text-sm">
                <span className="block font-medium">{i.product_title ?? i.title}</span>
                <span className="block text-xs text-stone">{i.variant_title} · Qty {i.quantity}</span>
              </span>
              <span className="text-sm font-semibold">{formatMoney(i.total, c)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-bark/10 pt-4 text-sm">
          <Row label="Subtotal" value={formatMoney(order.item_total ?? order.subtotal, c)} />
          {Number(order.discount_total) > 0 && <Row label="Discount" value={`−${formatMoney(order.discount_total, c)}`} />}
          <Row label="Shipping" value={formatMoney(order.shipping_total, c)} />
          {giftCards.map((g: any) => <Row key={g.id} label="Gift card" value={`−${formatMoney(g.amount, c)}`} />)}
          <div className="flex justify-between border-t border-bark/10 pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(order.total, c)}</dd></div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">Keep shopping</Link>
        {customer && <Link href="/account/orders" className="btn-ghost">View your orders</Link>}
      </div>
    </div>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between"><dt className="text-bark-soft">{label}</dt><dd>{value}</dd></div>
)

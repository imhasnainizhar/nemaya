import Link from "next/link"
import Image from "next/image"
import { listOrders } from "@/lib/data"
import { formatMoney } from "@/lib/util"

export default async function OrdersPage() {
  const { orders } = await listOrders(50).catch(() => ({ orders: [], count: 0 }))
  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl">Orders</h2>
      {orders.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-stone">No orders yet.</p>
          <Link href="/shop" className="btn-primary mt-6">Start shopping</Link>
        </div>
      )}
      {orders.map((o) => (
        <Link key={o.id} href={`/order/${o.id}`} className="card block p-6 transition hover:-translate-y-0.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Order #{o.display_id}</p>
            <p className="text-sm text-stone">{new Date(o.created_at as any).toLocaleDateString()}</p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex -space-x-3">
              {o.items?.slice(0, 5).map((i) => (
                <span key={i.id} className="relative h-14 w-12 overflow-hidden rounded-xl bg-sand ring-2 ring-paper">
                  {i.thumbnail && <Image src={i.thumbnail} alt="" fill sizes="48px" unoptimized={i.thumbnail.endsWith(".svg")} className="object-cover" />}
                </span>
              ))}
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatMoney(o.total, o.currency_code)}</p>
              <p className="text-xs text-stone capitalize">{String((o as any).fulfillment_status ?? o.status).replace(/_/g, " ")}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

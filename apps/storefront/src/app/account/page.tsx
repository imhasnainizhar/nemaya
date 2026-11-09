import Link from "next/link"
import { ArrowRight, Bell, Gift, Heart, Package } from "lucide-react"
import { getInbox, getProfile, getWishlist, listOrders } from "@/lib/data"
import { formatMoney, timeAgo } from "@/lib/util"
import { PushToggle } from "@/components/push-toggle"

export default async function AccountOverview({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const [{ welcome }, me, orders, wishlist, inbox] = await Promise.all([
    searchParams,
    getProfile(),
    listOrders(3).catch(() => ({ orders: [], count: 0 })),
    getWishlist(),
    getInbox(4),
  ])

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="card flex flex-col gap-4 bg-moss p-6 text-linen sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl">Welcome to Nemaya, {me?.customer?.first_name} 🌿</p>
            <p className="mt-1 text-sm text-linen/80">Turn on notifications to hear about price drops and restocks on your wishlist.</p>
          </div>
          <PushToggle compact />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["/account/orders", Package, orders.count, "Orders"],
          ["/account/wishlist", Heart, wishlist.items.length, "Saved items"],
          ["/account/notifications", Bell, inbox.unread_count, "Unread notifications"],
        ].map(([href, Icon, n, label]: any) => (
          <Link key={href} href={href} className="card group p-6 transition hover:-translate-y-0.5">
            <Icon className="h-5 w-5 text-clay" strokeWidth={1.7} />
            <p className="font-display mt-6 text-4xl">{n}</p>
            <p className="text-sm text-bark-soft">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Recent orders</h2>
            <Link href="/account/orders" className="text-sm font-semibold hover:text-clay">All</Link>
          </div>
          <ul className="mt-4 divide-y divide-bark/10">
            {orders.orders.length === 0 && <li className="py-6 text-sm text-stone">No orders yet.</li>}
            {orders.orders.map((o) => (
              <li key={o.id}>
                <Link href={`/order/${o.id}`} className="flex items-center justify-between py-3 text-sm hover:text-clay">
                  <span>#{o.display_id} · {new Date(o.created_at as any).toLocaleDateString()}</span>
                  <span className="font-semibold">{formatMoney(o.total, o.currency_code)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Latest updates</h2>
            <Link href="/account/notifications" className="text-sm font-semibold hover:text-clay">Inbox</Link>
          </div>
          <ul className="mt-4 divide-y divide-bark/10">
            {inbox.messages.length === 0 && <li className="py-6 text-sm text-stone">Nothing yet.</li>}
            {inbox.messages.map((m) => (
              <li key={m.id} className="py-3 text-sm">
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-stone">{timeAgo(m.created_at)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Link href="/gift-cards" className="card flex items-center justify-between p-6 transition hover:bg-sand/40">
        <span className="flex items-center gap-3"><Gift className="h-5 w-5 text-moss" /> Send a Nemaya gift card</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

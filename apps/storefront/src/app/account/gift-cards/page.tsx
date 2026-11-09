import Link from "next/link"
import { getMyGiftCards } from "@/lib/data"
import type { GiftCardSummary } from "@/lib/types"
import { formatMoney } from "@/lib/util"

export default async function MyGiftCards() {
  const { received, sent } = await getMyGiftCards()
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl">Gift cards</h2>
        <Link href="/gift-cards" className="btn-primary">Send a gift card</Link>
      </div>
      <List title="Received" cards={received} empty="Gift cards sent to your email will appear here." showCode />
      <List title="Sent" cards={sent} empty="Gift cards you buy for others will appear here." />
    </div>
  )
}

function List({ title, cards, empty, showCode = false }: { title: string; cards: GiftCardSummary[]; empty: string; showCode?: boolean }) {
  return (
    <section className="card p-6 sm:p-8">
      <h3 className="font-display text-2xl">{title}</h3>
      <ul className="mt-4 divide-y divide-bark/10">
        {cards.length === 0 && <li className="py-4 text-sm text-stone">{empty}</li>}
        {cards.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-mono text-sm">{c.code}</p>
              <p className="text-xs text-stone">
                {showCode ? `From ${c.sender_name ?? "someone"}` : `To ${c.recipient_name ?? c.recipient_email}`} ·{" "}
                {c.delivered_at ? `Delivered ${new Date(c.delivered_at).toLocaleDateString()}` : c.deliver_at ? `Scheduled ${new Date(c.deliver_at).toLocaleDateString()}` : "Pending"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatMoney(c.balance, c.currency_code)}</p>
              <p className="text-xs text-stone">of {formatMoney(c.initial_amount, c.currency_code)}{c.status !== "active" && ` · ${c.status}`}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

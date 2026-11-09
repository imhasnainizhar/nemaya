"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { checkGiftCardBalanceAction } from "@/lib/actions"
import { GiftCardVisual } from "@/components/gift-card-visual"
import { formatMoney } from "@/lib/util"

export default function BalancePage() {
  const [state, action, pending] = useActionState(checkGiftCardBalanceAction as any, undefined) as [any, any, boolean]
  const card = state?.card

  return (
    <div className="container-x grid max-w-5xl items-center gap-12 pt-16 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-5xl tracking-tight">Check your balance</h1>
        <p className="mt-3 text-bark-soft">Enter the code from your gift card email.</p>
        <form action={action} className="mt-8 flex gap-2">
          <input name="code" required placeholder="NEMA-XXXX-XXXX-XXXX" className="input uppercase" autoComplete="off" />
          <button disabled={pending} className="btn-primary shrink-0">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}</button>
        </form>
        {state?.error && <p className="mt-4 text-sm text-clay">{state.error}</p>}
        {card && (
          <div className="card mt-6 p-6">
            <p className="font-mono text-sm text-stone">{card.code}</p>
            <p className="font-display mt-2 text-4xl">{formatMoney(card.balance, card.currency_code)}</p>
            <p className="mt-1 text-sm text-bark-soft">
              {card.usable ? "Ready to use at checkout." : card.reason}
              {card.expires_at && ` · Expires ${new Date(card.expires_at).toLocaleDateString()}`}
            </p>
          </div>
        )}
      </div>
      <GiftCardVisual amount={card ? Number(card.balance) : undefined} />
    </div>
  )
}

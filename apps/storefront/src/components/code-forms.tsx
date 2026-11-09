"use client"

import { useActionState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Gift, Loader2, Tag, X } from "lucide-react"
import { applyGiftCardAction, applyPromoAction, removeGiftCardAction } from "@/lib/actions"
import type { Cart } from "@/lib/types"
import { formatMoney } from "@/lib/util"

export function CodeForms({ cart }: { cart: Cart }) {
  const router = useRouter()
  const [gcState, gcAction, gcPending] = useActionState(applyGiftCardAction, undefined)
  const [promoState, promoAction, promoPending] = useActionState(applyPromoAction, undefined)
  const [removing, start] = useTransition()
  const giftCards = (cart.credit_lines ?? []).filter((l) => l.reference === "gift_card")
  const hasGiftCardItems = (cart.items ?? []).some((i) => (i.metadata as any)?.nemaya_gift_card)

  return (
    <div className="card space-y-5 p-6">
      {!hasGiftCardItems && (
        <form action={gcAction}>
          <label htmlFor="gc" className="label flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" /> Gift card</label>
          <div className="flex gap-2">
            <input id="gc" name="code" placeholder="NEMA-XXXX-XXXX-XXXX" className="input uppercase" autoComplete="off" />
            <button disabled={gcPending} className="btn-ghost shrink-0 px-5">{gcPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}</button>
          </div>
          {gcState?.error && <p className="mt-2 text-xs text-clay">{gcState.error}</p>}
          {gcState?.ok && <p className="mt-2 text-xs text-moss">{gcState.message}</p>}
          {giftCards.length > 0 && (
            <ul className="mt-3 space-y-2">
              {giftCards.map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded-xl bg-sand/60 px-3 py-2 text-xs">
                  <span><span className="font-mono">{g.metadata?.code_masked}</span> · −{formatMoney(g.amount, cart.currency_code)}</span>
                  <button
                    aria-label="Remove gift card"
                    disabled={removing}
                    onClick={() => start(async () => { await removeGiftCardAction(g.id); router.refresh() })}
                    className="rounded-full p-1 hover:bg-sand"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      )}
      <form action={promoAction}>
        <label htmlFor="promo" className="label flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Promo code</label>
        <div className="flex gap-2">
          <input id="promo" name="code" placeholder="Code" className="input uppercase" autoComplete="off" />
          <button disabled={promoPending} className="btn-ghost shrink-0 px-5">{promoPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}</button>
        </div>
        {promoState?.error && <p className="mt-2 text-xs text-clay">{promoState.error}</p>}
        {(cart.promotions ?? []).map((p) => (
          <p key={p.id} className="mt-2 text-xs text-moss">Applied: {p.code}</p>
        ))}
      </form>
    </div>
  )
}

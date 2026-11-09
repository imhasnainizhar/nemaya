"use client"

import { useActionState, useState } from "react"
import { Loader2 } from "lucide-react"
import { buyGiftCardAction } from "@/lib/actions"
import { GiftCardVisual } from "@/components/gift-card-visual"
import { cn } from "@/lib/util"

export function BuyGiftCard({ presets, min, max, senderName }: { presets: number[]; min: number; max: number; senderName: string }) {
  const [state, action, pending] = useActionState(buyGiftCardAction, undefined)
  const [amount, setAmount] = useState<number>(presets[1] ?? 50)
  const [custom, setCustom] = useState("")
  const [to, setTo] = useState("")
  const [schedule, setSchedule] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
      <div className="lg:sticky lg:top-28 lg:h-fit">
        <GiftCardVisual amount={amount} to={to || undefined} className="max-w-lg" />
      </div>
      <form action={action} className="card space-y-6 p-6 sm:p-8">
        <input type="hidden" name="amount" value={amount} />
        <fieldset>
          <legend className="label">Amount</legend>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAmount(p)
                  setCustom("")
                }}
                className={cn("chip px-5", amount === p && !custom && "chip-active")}
              >
                ${p}
              </button>
            ))}
            <input
              inputMode="decimal"
              placeholder={`Custom $${min}–${max}`}
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value)
                const n = Number(e.target.value)
                if (n) setAmount(n)
              }}
              className="input w-40 rounded-full py-2"
              aria-label="Custom amount"
            />
          </div>
          {(amount < min || amount > max) && <p className="mt-2 text-xs text-clay">Choose an amount between ${min} and ${max}.</p>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Recipient name</span>
            <input name="recipient_name" required value={to} onChange={(e) => setTo(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="label">Recipient email</span>
            <input name="recipient_email" type="email" required className="input" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">From</span>
            <input name="sender_name" defaultValue={senderName} placeholder="Your name" className="input" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Message (optional)</span>
            <textarea name="message" rows={3} maxLength={500} className="input" placeholder="Happy birthday! Treat yourself." />
          </label>
        </div>

        <div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="h-4 w-4 accent-bark" />
            Schedule delivery for a later date
          </label>
          {schedule && (
            <input type="date" name="deliver_at" min={today} required className="input mt-3 max-w-xs" />
          )}
        </div>

        {state?.error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p>}
        <button disabled={pending || amount < min || amount > max} className="btn-primary w-full py-4 text-base">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Add gift card to cart
        </button>
        <p className="text-center text-xs text-stone">Gift cards can’t be bought with other gift cards.</p>
      </form>
    </div>
  )
}

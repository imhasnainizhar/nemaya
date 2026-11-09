"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, Trash2 } from "lucide-react"
import { updateLineItemAction } from "@/lib/actions"

export function QuantityControl({ lineId, quantity }: { lineId: string; quantity: number }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const set = (q: number) =>
    start(async () => {
      await updateLineItemAction(lineId, q)
      router.refresh()
    })

  return (
    <div className="flex items-center gap-3">
      <div className={`inline-flex items-center rounded-full border border-bark/15 ${pending ? "opacity-50" : ""}`}>
        <button aria-label="Decrease quantity" disabled={pending} onClick={() => set(quantity - 1)} className="p-2.5 hover:text-clay">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
        <button aria-label="Increase quantity" disabled={pending} onClick={() => set(quantity + 1)} className="p-2.5 hover:text-clay">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button aria-label="Remove item" disabled={pending} onClick={() => set(0)} className="rounded-full p-2 text-stone hover:bg-sand hover:text-bark">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

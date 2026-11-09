import { cn, formatMoney } from "@/lib/util"

export function GiftCardVisual({ amount, to, className }: { amount?: number; to?: string; className?: string }) {
  return (
    <div className={cn("grain relative aspect-[1.6/1] w-full overflow-hidden rounded-[28px] bg-clay p-7 text-linen shadow-xl shadow-clay/20", className)}>
      <div className="blob absolute -top-12 -right-10 h-48 w-48 bg-ochre/50" />
      <div className="blob absolute -bottom-16 -left-10 h-48 w-48 bg-clay-deep/70" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="font-display text-3xl">nemaya<span className="text-ochre">.</span></span>
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-80">Gift card</span>
        </div>
        <div>
          {to && <p className="text-sm opacity-80">For {to}</p>}
          <p className="font-display text-5xl">{amount ? formatMoney(amount) : "$—"}</p>
        </div>
      </div>
    </div>
  )
}

"use client"

import Image from "next/image"
import Link from "next/link"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Gift, Loader2, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react"
import { updateLineItemAction } from "@/lib/actions"
import { Sheet } from "@/components/ui/sheet"
import { useUI } from "@/components/ui/ui-provider"
import { cn, formatMoney } from "@/lib/util"

const FREE_SHIPPING = 99

/** Cart: right drawer on desktop, bottom sheet on mobile. */
export function CartDrawer() {
  const ui = useUI()
  const router = useRouter()
  const [pending, start] = useTransition()
  const cart = ui.cart
  const items = [...(cart?.items ?? [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
  const currency = cart?.currency_code ?? "usd"
  const subtotal = Number(cart?.item_total ?? 0)
  const toFree = Math.max(0, FREE_SHIPPING - subtotal)
  const pct = Math.min(100, (subtotal / FREE_SHIPPING) * 100)

  const setQty = (lineId: string, q: number) =>
    start(async () => {
      await updateLineItemAction(lineId, q)
      await ui.refreshCart()
      router.refresh()
    })

  return (
    <Sheet
      open={ui.panel === "cart"}
      onClose={ui.close}
      title={`Your cart${items.length ? ` (${ui.cartCount})` : ""}`}
      anchor="right"
      desktopWidth={550}
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-bark-soft">Subtotal</span>
              <span className="font-display text-2xl">{formatMoney(subtotal, currency)}</span>
            </div>
            <p className="text-xs text-stone">Shipping, taxes and gift cards are applied at checkout.</p>
            <div className="grid grid-cols-[1fr_1.4fr] gap-2">
              <Link href="/cart" className="btn-ghost py-3.5">View cart</Link>
              <Link href="/checkout" className="btn-primary py-3.5">
                Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="ny-reveal flex flex-col items-center px-6 py-16 text-center" style={{ ["--d" as any]: "0.25s" }}>
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sand">
            <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="font-display mt-5 text-2xl">Your cart is empty</p>
          <p className="mt-1 text-sm text-stone">Find something you’ll live in.</p>
          <Link href="/shop" onClick={ui.close} className="btn-primary mt-6">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className={cn("px-5 sm:px-6", pending && "opacity-60")}>
          {/* free shipping progress */}
          <div className="ny-reveal mb-2 rounded-2xl border border-transparent p-4 [background:linear-gradient(var(--color-paper),var(--color-paper))_padding-box,linear-gradient(90deg,var(--color-moss),var(--color-ochre),var(--color-clay))_border-box]" style={{ ["--d" as any]: "0.25s" }}>
            <p className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-moss" />
              {toFree > 0 ? (
                <span>
                  You’re <strong>{formatMoney(toFree, currency)}</strong> away from free shipping
                </span>
              ) : (
                <span className="font-semibold text-moss">You’ve unlocked free shipping 🌿</span>
              )}
            </p>
            <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-moss),var(--color-ochre),var(--color-clay))] transition-[width] duration-500 [transition-timing-function:var(--ease-fill)]" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <ul className="divide-y divide-bark/10">
            {items.map((item, idx) => {
              const gift = (item.metadata as any)?.nemaya_gift_card
              const sale = Number((item as any).compare_at_unit_price) > Number(item.unit_price)
              return (
                <li key={item.id} className="ny-reveal flex gap-4 py-5" style={{ ["--d" as any]: `${0.3 + idx * 0.06}s` }}>
                  <Link
                    href={gift ? "/gift-cards" : `/products/${item.product_handle}`}
                    onClick={ui.close}
                    className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-2xl bg-sand"
                  >
                    {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="80px" unoptimized={item.thumbnail.endsWith(".svg")} className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.product_title ?? item.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-bark-soft">
                          {gift ? <><Gift className="h-3 w-3" /> For {(item.metadata as any).recipient_name}</> : item.variant_title}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">{formatMoney(Number(item.unit_price) * item.quantity, currency)}</p>
                        {sale && <p className="text-xs text-stone line-through">{formatMoney(Number((item as any).compare_at_unit_price) * item.quantity, currency)}</p>}
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center rounded-full border border-bark/15">
                        <button aria-label="Decrease quantity" disabled={pending} onClick={() => setQty(item.id, item.quantity - 1)} className="p-2 hover:text-clay">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button aria-label="Increase quantity" disabled={pending} onClick={() => setQty(item.id, item.quantity + 1)} className="p-2 hover:text-clay">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button aria-label="Remove" disabled={pending} onClick={() => setQty(item.id, 0)} className="rounded-full p-2 text-stone hover:bg-sand hover:text-bark">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Sheet>
  )
}

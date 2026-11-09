import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Gift } from "lucide-react"
import { getCart } from "@/lib/data"
import { formatMoney } from "@/lib/util"
import { QuantityControl } from "./quantity-control"
import { CodeForms } from "@/components/code-forms"
import { CartTotals } from "@/components/cart-totals"

export const metadata: Metadata = { title: "Cart" }
export const dynamic = "force-dynamic"

export default async function CartPage() {
  const cart = await getCart()
  const items = [...(cart?.items ?? [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))

  if (!cart || items.length === 0) {
    return (
      <div className="container-x py-28 text-center">
        <h1 className="font-display text-5xl">Your cart is empty</h1>
        <p className="mt-3 text-stone">Find something you’ll live in.</p>
        <Link href="/shop" className="btn-primary mt-8">Start shopping <ArrowRight className="h-4 w-4" /></Link>
      </div>
    )
  }

  const currency = cart.currency_code
  return (
    <div className="container-x pt-12">
      <h1 className="font-display text-5xl tracking-tight">Cart</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <ul className="divide-y divide-bark/10 border-y border-bark/10">
          {items.map((item) => {
            const gift = (item.metadata as any)?.nemaya_gift_card
            return (
              <li key={item.id} className="flex gap-5 py-6">
                <Link href={gift ? "/gift-cards" : `/products/${item.product_handle}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-2xl bg-sand sm:w-28">
                  {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="112px" unoptimized={item.thumbnail.endsWith(".svg")} className="object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.product_title ?? item.title}</p>
                      {gift ? (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-bark-soft">
                          <Gift className="h-3.5 w-3.5" /> For {(item.metadata as any).recipient_name} · {(item.metadata as any).recipient_email}
                          {(item.metadata as any).deliver_at ? ` · ${new Date((item.metadata as any).deliver_at).toDateString()}` : " · sends today"}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-bark-soft">{item.variant_title}</p>
                      )}
                    </div>
                    <p className="font-semibold">{formatMoney(item.total ?? Number(item.unit_price) * item.quantity, currency)}</p>
                  </div>
                  <div className="mt-auto pt-4">
                    <QuantityControl lineId={item.id} quantity={item.quantity} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <aside className="h-fit space-y-5 lg:sticky lg:top-28">
          <div className="card p-6">
            <h2 className="font-display text-2xl">Summary</h2>
            <CartTotals cart={cart} />
            <Link href="/checkout" className="btn-primary mt-6 w-full py-4 text-base">
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-stone">Shipping & taxes calculated at checkout</p>
          </div>
          <CodeForms cart={cart} />
        </aside>
      </div>
    </div>
  )
}

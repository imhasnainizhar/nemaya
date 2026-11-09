import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import { getCart, getCustomer, getPaymentProviders, getShippingOptions } from "@/lib/data"
import { CartTotals } from "@/components/cart-totals"
import { CodeForms } from "@/components/code-forms"
import { CheckoutFlow } from "./checkout-flow"

export const metadata: Metadata = { title: "Checkout" }
export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const cart = await getCart()
  if (!cart || !cart.items?.length) redirect("/cart")

  const [customer, shippingOptions, providers] = await Promise.all([
    getCustomer(),
    getShippingOptions(cart.id),
    getPaymentProviders(cart.region_id!),
  ])
  const requiresShipping = (cart.items ?? []).some((i) => i.requires_shipping)

  return (
    <div className="container-x pt-12">
      <h1 className="font-display text-5xl tracking-tight">Checkout</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
        <CheckoutFlow
          cart={JSON.parse(JSON.stringify(cart))}
          customerEmail={customer?.email ?? null}
          customerName={customer ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") : ""}
          countries={(cart.region?.countries ?? []).map((c: any) => ({ code: c.iso_2, name: c.display_name }))}
          shippingOptions={shippingOptions.map((o) => ({ id: o.id, name: o.name, amount: o.amount ?? o.calculated_price?.calculated_amount ?? 0, description: o.type?.description ?? "" }))}
          providers={providers.map((p) => p.id)}
          requiresShipping={requiresShipping}
          stripeKey={process.env.NEXT_PUBLIC_STRIPE_KEY ?? ""}
        />
        <aside className="h-fit space-y-5 lg:sticky lg:top-28">
          <div className="card p-6">
            <h2 className="font-display text-2xl">Your order</h2>
            <ul className="mt-5 space-y-4">
              {cart.items!.map((i) => (
                <li key={i.id} className="flex gap-3">
                  <span className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                    {i.thumbnail && <Image src={i.thumbnail} alt="" fill sizes="56px" unoptimized={i.thumbnail.endsWith(".svg")} className="object-cover" />}
                    <span className="absolute -top-0 -right-0 grid h-5 w-5 place-items-center rounded-full bg-bark text-[10px] font-bold text-linen">{i.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-medium">{i.product_title ?? i.title}</span>
                    <span className="block text-xs text-stone">{i.variant_title}</span>
                  </span>
                </li>
              ))}
            </ul>
            <CartTotals cart={cart} showShipping={requiresShipping} />
          </div>
          <CodeForms cart={cart} />
        </aside>
      </div>
    </div>
  )
}

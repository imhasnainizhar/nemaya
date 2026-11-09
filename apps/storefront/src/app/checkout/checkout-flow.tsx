"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { Check, CreditCard, FlaskConical, Gift, Loader2, Lock } from "lucide-react"
import { completeOrderAction, initPaymentAction, saveAddressAction, setShippingMethodAction } from "@/lib/checkout-actions"
import type { Cart } from "@/lib/types"
import { cn, formatMoney } from "@/lib/util"
import { STRIPE_TEST_CARD } from "@/lib/constants"

type Props = {
  cart: Cart
  customerEmail: string | null
  customerName: string
  countries: { code: string; name: string }[]
  shippingOptions: { id: string; name: string; amount: number; description: string }[]
  providers: string[]
  requiresShipping: boolean
  stripeKey: string
}

let stripePromise: Promise<Stripe | null> | null = null
const getStripe = (key: string) => (stripePromise ??= loadStripe(key))

export function CheckoutFlow(props: Props) {
  const { cart } = props
  const addr = cart.shipping_address
  const [step, setStep] = useState<1 | 2 | 3>(addr?.address_1 && cart.email ? (props.requiresShipping && !cart.shipping_methods?.length ? 2 : 3) : 1)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()

  const [form, setForm] = useState({
    email: cart.email ?? props.customerEmail ?? "",
    full_name: addr ? [addr.first_name, addr.last_name].filter((x) => x && x !== "-").join(" ") : props.customerName,
    phone: addr?.phone ?? "",
    address_1: addr?.address_1 ?? "",
    address_2: addr?.address_2 ?? "",
    city: addr?.city ?? "",
    province: addr?.province ?? "",
    postal_code: addr?.postal_code ?? "",
    country_code: addr?.country_code ?? props.countries[0]?.code ?? "us",
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const saveAddress = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await saveAddressAction(form)
      if (!res.ok) return setError(res.error)
      router.refresh()
      setStep(props.requiresShipping ? 2 : 3)
    })
  }

  const chooseShipping = (id: string) =>
    start(async () => {
      setError(null)
      const res = await setShippingMethodAction(id)
      if (!res.ok) return setError(res.error)
      router.refresh()
    })

  const selectedShipping = cart.shipping_methods?.[0]?.shipping_option_id

  return (
    <div className="space-y-4">
      {/* 1. contact + address */}
      <Section n={1} title="Contact & address" active={step === 1} done={step > 1} onEdit={() => setStep(1)}
        summary={addr?.address_1 ? `${cart.email} · ${addr.address_1}, ${addr.city}` : undefined}>
        <form onSubmit={saveAddress} className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" className="sm:col-span-2"><input required type="email" value={form.email} onChange={set("email")} className="input" autoComplete="email" /></Field>
          <Field label="Full name" className="sm:col-span-2"><input required value={form.full_name} onChange={set("full_name")} className="input" autoComplete="name" /></Field>
          <Field label="Address" className="sm:col-span-2"><input required value={form.address_1} onChange={set("address_1")} className="input" autoComplete="address-line1" /></Field>
          <Field label="Apartment, suite (optional)" className="sm:col-span-2"><input value={form.address_2} onChange={set("address_2")} className="input" autoComplete="address-line2" /></Field>
          <Field label="City"><input required value={form.city} onChange={set("city")} className="input" autoComplete="address-level2" /></Field>
          <Field label="Postal code"><input required value={form.postal_code} onChange={set("postal_code")} className="input" autoComplete="postal-code" /></Field>
          <Field label="Country">
            <select value={form.country_code} onChange={set("country_code")} className="input" autoComplete="country">
              {props.countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Phone (optional)"><input value={form.phone} onChange={set("phone")} className="input" autoComplete="tel" /></Field>
          <div className="sm:col-span-2">
            <button disabled={pending} className="btn-primary w-full py-4 sm:w-auto">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Continue
            </button>
          </div>
        </form>
      </Section>

      {/* 2. delivery */}
      {props.requiresShipping && (
        <Section n={2} title="Delivery" active={step === 2} done={step > 2} onEdit={() => setStep(2)}
          summary={cart.shipping_methods?.[0] ? `${cart.shipping_methods[0].name} · ${formatMoney(cart.shipping_methods[0].amount, cart.currency_code)}` : undefined}>
          <div className="space-y-3">
            {props.shippingOptions.length === 0 && <p className="text-sm text-stone">No delivery options for this address yet.</p>}
            {props.shippingOptions.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={pending}
                onClick={() => chooseShipping(o.id)}
                className={cn("flex w-full items-center justify-between rounded-2xl border p-4 text-left transition", selectedShipping === o.id ? "border-bark bg-sand/50" : "border-bark/15 hover:border-bark/40")}
              >
                <span>
                  <span className="block text-sm font-semibold">{o.name}</span>
                  <span className="block text-xs text-stone">{o.description}</span>
                </span>
                <span className="text-sm font-semibold">{Number(o.amount) === 0 ? "Free" : formatMoney(o.amount, cart.currency_code)}</span>
              </button>
            ))}
            <button disabled={!selectedShipping || pending} onClick={() => setStep(3)} className="btn-primary mt-2 py-4">
              Continue to payment
            </button>
          </div>
        </Section>
      )}

      {/* 3. payment */}
      <Section n={props.requiresShipping ? 3 : 2} title="Payment" active={step === 3} done={false}>
        <Payment {...props} onError={setError} />
      </Section>

      {error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>}
    </div>
  )
}

function Payment({ cart, providers, stripeKey, onError }: Props & { onError: (e: string | null) => void }) {
  const total = Number(cart.total)
  const hasStripe = providers.includes("pp_stripe_stripe") && !!stripeKey
  const hasSystem = providers.includes("pp_system_default")

  if (total <= 0) return <PlaceOrder label="Place order" icon={<Gift className="h-4 w-4" />} note="Your gift card covers this order." onError={onError} />
  if (hasStripe) {
    return (
      <Elements stripe={getStripe(stripeKey)}>
        <StripeCard cart={cart} onError={onError} />
      </Elements>
    )
  }
  if (hasSystem) {
    return (
      <PlaceOrder
        label={`Pay ${formatMoney(total, cart.currency_code)} (test)`}
        icon={<FlaskConical className="h-4 w-4" />}
        note="Stripe isn't configured locally, so this uses Medusa's built-in test payment. Add test keys to .env.docker to use Stripe."
        provider="pp_system_default"
        onError={onError}
      />
    )
  }
  return <p className="text-sm text-clay">No payment method is configured for this region.</p>
}

function PlaceOrder({ label, icon, note, provider, onError }: { label: string; icon: React.ReactNode; note: string; provider?: string; onError: (e: string | null) => void }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const place = () =>
    start(async () => {
      onError(null)
      if (provider) {
        const init = await initPaymentAction(provider)
        if (!init.ok) return onError(init.error)
      }
      const res = await completeOrderAction()
      if (!res.ok) return onError(res.error)
      router.push(`/order/${res.orderId}`)
    })
  return (
    <div>
      <p className="mb-4 text-sm text-bark-soft">{note}</p>
      <button onClick={place} disabled={pending} className="btn-primary w-full py-4 text-base">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon} {label}
      </button>
    </div>
  )
}

function StripeCard({ cart, onError }: { cart: Cart; onError: (e: string | null) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [pending, start] = useTransition()
  const [complete, setComplete] = useState(false)
  const router = useRouter()

  const style = useMemo(
    () => ({
      base: { fontSize: "16px", color: "#2a241d", fontFamily: "Inter, system-ui, sans-serif", "::placeholder": { color: "#8a8072" } },
      invalid: { color: "#b5643c" },
    }),
    []
  )

  const pay = () =>
    start(async () => {
      onError(null)
      if (!stripe || !elements) return
      const init = await initPaymentAction("pp_stripe_stripe")
      if (!init.ok || !init.clientSecret) return onError(init.ok ? "Couldn't start the payment." : init.error)
      const card = elements.getElement(CardElement)!
      const addr = cart.shipping_address
      const { error } = await stripe.confirmCardPayment(init.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: [addr?.first_name, addr?.last_name].filter(Boolean).join(" ") || undefined,
            email: cart.email ?? undefined,
          },
        },
      })
      if (error && error.payment_intent?.status !== "requires_capture" && error.payment_intent?.status !== "succeeded") {
        return onError(error.message ?? "Payment failed.")
      }
      const res = await completeOrderAction()
      if (!res.ok) return onError(res.error)
      router.push(`/order/${res.orderId}`)
    })

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-ochre/40 bg-ochre/10 px-4 py-3 text-sm">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
        <p>
          <span className="font-semibold">Demo store — test mode.</span> Use card <span className="font-mono font-semibold">{STRIPE_TEST_CARD}</span>, any future date, any CVC. No real money moves.
        </p>
      </div>
      <div className="rounded-2xl border border-bark/15 bg-paper px-4 py-4">
        <CardElement options={{ style, hidePostalCode: true }} onChange={(e) => setComplete(e.complete)} />
      </div>
      <button onClick={pay} disabled={pending || !complete || !stripe} className="btn-primary w-full py-4 text-base">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Pay {formatMoney(cart.total, cart.currency_code)}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-stone"><CreditCard className="h-3.5 w-3.5" /> Payments processed by Stripe (test mode)</p>
    </div>
  )
}

function Section({ n, title, active, done, onEdit, summary, children }: { n: number; title: string; active: boolean; done: boolean; onEdit?: () => void; summary?: string; children: React.ReactNode }) {
  return (
    <section className={cn("card p-6 transition", !active && "opacity-90")}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-3 font-display text-2xl">
          <span className={cn("grid h-8 w-8 place-items-center rounded-full text-sm font-sans font-bold", done ? "bg-moss text-linen" : active ? "bg-bark text-linen" : "bg-sand")}>
            {done ? <Check className="h-4 w-4" /> : n}
          </span>
          {title}
        </h2>
        {done && onEdit && <button onClick={onEdit} className="text-sm font-semibold underline underline-offset-4">Edit</button>}
      </div>
      {!active && done && summary && <p className="mt-3 pl-11 text-sm text-bark-soft">{summary}</p>}
      {active && <div className="mt-6">{children}</div>}
    </section>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

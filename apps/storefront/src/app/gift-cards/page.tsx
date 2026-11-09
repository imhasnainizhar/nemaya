import type { Metadata } from "next"
import Link from "next/link"
import { getCustomer, getGiftCardConfig } from "@/lib/data"
import { BuyGiftCard } from "./buy-gift-card"

export const metadata: Metadata = { title: "Gift cards" }

export default async function GiftCardsPage() {
  const [config, customer] = await Promise.all([getGiftCardConfig(), getCustomer()])
  const senderName = customer ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") : ""

  return (
    <div className="container-x pt-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">Digital gift card</p>
        <h1 className="font-display mt-3 text-5xl leading-[1.02] tracking-tight sm:text-6xl">Give something they’ll live in.</h1>
        <p className="mt-4 text-bark-soft">
          Delivered by email — today or on a date you choose. Usable on anything in the store, never expires, and any balance left carries over.{" "}
          <Link href="/gift-cards/balance" className="font-semibold text-bark underline underline-offset-4">Check a balance</Link>
        </p>
      </div>
      {config?.available ? (
        <BuyGiftCard presets={config.presets} min={config.min} max={config.max} senderName={senderName} />
      ) : (
        <p className="mt-10 text-stone">Gift cards aren’t available right now.</p>
      )}
    </div>
  )
}

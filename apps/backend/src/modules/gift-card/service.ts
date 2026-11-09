import { randomInt } from "crypto"
import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import GiftCard from "./models/gift-card"
import GiftCardTransaction from "./models/gift-card-transaction"

// no 0/O/1/I/L to avoid confusion when typing a code
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export const GIFT_CARD_LIMITS = {
  presets: [25, 50, 100, 200],
  min: 10,
  max: 500,
  maxPerCart: 3,
}

export const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

export function normalizeCode(code: string) {
  const compact = (code || "").toUpperCase().replace(/[^A-Z0-9]/g, "")
  // NEMA + 12 chars → NEMA-XXXX-XXXX-XXXX
  if (compact.length === 16) return compact.match(/.{4}/g)!.join("-")
  return (code || "").toUpperCase().trim()
}

export function maskCode(code: string) {
  return code.replace(/^(.{4}-).*(.{4})$/, "$1••••-••••-$2")
}

type GiftCardRecord = {
  id: string
  code: string
  balance: number
  status: string
  expires_at: Date | string | null
  currency_code: string
}

class GiftCardModuleService extends MedusaService({ GiftCard, GiftCardTransaction }) {
  generateCode() {
    const block = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")
    return `NEMA-${block()}-${block()}-${block()}`
  }

  async findByCode(code: string) {
    const [card] = await this.listGiftCards({ code: normalizeCode(code) }, { take: 1 })
    return card ?? null
  }

  /** Returns null when usable, otherwise the reason it can't be used. */
  unusableReason(card: GiftCardRecord | null, currencyCode?: string): string | null {
    if (!card) return "Gift card not found."
    if (card.status !== "active") return "This gift card is disabled."
    if (card.expires_at && new Date(card.expires_at).getTime() < Date.now()) return "This gift card has expired."
    if (Number(card.balance) <= 0) return "This gift card has no balance left."
    if (currencyCode && card.currency_code !== currencyCode.toLowerCase()) {
      return `This gift card is in ${card.currency_code.toUpperCase()}.`
    }
    return null
  }

  async issue(input: {
    amount: number
    currency_code?: string
    source?: "purchase" | "admin"
    expires_at?: Date | null
    purchaser_customer_id?: string | null
    purchaser_email?: string | null
    sender_name?: string | null
    recipient_name?: string | null
    recipient_email?: string | null
    message?: string | null
    deliver_at?: Date | null
    order_id?: string | null
    line_item_id?: string | null
    note?: string | null
    actor_id?: string | null
  }) {
    const amount = round2(input.amount)
    if (!(amount > 0)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Amount must be positive.")

    let code = this.generateCode()
    // astronomically unlikely, but never trust randomness blindly
    for (let i = 0; i < 5 && (await this.findByCode(code)); i++) code = this.generateCode()

    const { actor_id, amount: _amount, ...rest } = input
    const card = await this.createGiftCards({
      ...rest,
      code,
      currency_code: (input.currency_code ?? "usd").toLowerCase(),
      initial_amount: amount,
      balance: amount,
      source: input.source ?? "purchase",
    } as any)

    await this.createGiftCardTransactions({
      gift_card_id: card.id,
      type: "issue",
      amount,
      balance_after: amount,
      order_id: input.order_id ?? null,
      actor_id: actor_id ?? null,
      reason: input.note ?? null,
    } as any)
    return card
  }

  async redeem(cardId: string, amount: number, ctx: { order_id?: string; cart_id?: string }) {
    const card = await this.retrieveGiftCard(cardId)
    const reason = this.unusableReason(card as any)
    if (reason) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, reason)
    const value = round2(amount)
    if (value > Number(card.balance) + 0.001) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Gift card balance is too low.")
    }
    const balance = round2(Number(card.balance) - value)
    await this.updateGiftCards({ id: card.id, balance })
    await this.createGiftCardTransactions({
      gift_card_id: card.id,
      type: "redeem",
      amount: -value,
      balance_after: balance,
      order_id: ctx.order_id ?? null,
      cart_id: ctx.cart_id ?? null,
    } as any)
    return { ...card, balance }
  }

  async adjust(cardId: string, delta: number, reason: string, actorId?: string) {
    const card = await this.retrieveGiftCard(cardId)
    const balance = round2(Number(card.balance) + Number(delta))
    if (balance < 0) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Balance can't go below zero.")
    await this.updateGiftCards({ id: card.id, balance })
    await this.createGiftCardTransactions({
      gift_card_id: card.id,
      type: "adjust",
      amount: round2(delta),
      balance_after: balance,
      reason,
      actor_id: actorId ?? null,
    } as any)
    return { ...card, balance }
  }

  async setStatus(cardId: string, status: "active" | "disabled", reason?: string, actorId?: string) {
    const card = await this.retrieveGiftCard(cardId)
    if (card.status === status) return card
    await this.updateGiftCards({ id: card.id, status })
    await this.createGiftCardTransactions({
      gift_card_id: card.id,
      type: status === "disabled" ? "disable" : "enable",
      amount: 0,
      balance_after: Number(card.balance),
      reason: reason ?? null,
      actor_id: actorId ?? null,
    } as any)
    return { ...card, status }
  }
}

export default GiftCardModuleService

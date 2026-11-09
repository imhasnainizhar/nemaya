import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createCartCreditLinesWorkflow, deleteCartCreditLinesWorkflow } from "@medusajs/medusa/core-flows"
import { GIFT_CARD_MODULE } from "../modules/gift-card"
import type GiftCardModuleService from "../modules/gift-card/service"
import { GIFT_CARD_LIMITS, maskCode, round2 } from "../modules/gift-card/service"
import { money, notify, storeUrl } from "./notify"

export const GIFT_CARD_REFERENCE = "gift_card"
export const GIFT_CARD_PRODUCT_HANDLE = "nemaya-gift-card"

const CART_FIELDS = [
  "id",
  "currency_code",
  "total",
  "credit_line_total",
  "items.id",
  "items.metadata",
  "credit_lines.id",
  "credit_lines.amount",
  "credit_lines.reference",
  "credit_lines.reference_id",
  "credit_lines.metadata",
]

export async function getCartForGiftCards(container: MedusaContainer, cartId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "cart", fields: CART_FIELDS, filters: { id: cartId } })
  const cart = data[0] as any
  if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found.")
  return cart
}

const giftCardLines = (cart: any) => (cart.credit_lines ?? []).filter((l: any) => l?.reference === GIFT_CARD_REFERENCE)

/** Amount still payable before any gift cards are applied. */
const grossTotal = (cart: any) => round2(Number(cart.total ?? 0) + Number(cart.credit_line_total ?? 0))

export async function applyGiftCardToCart(container: MedusaContainer, cartId: string, code: string) {
  const giftCards = container.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const cart = await getCartForGiftCards(container, cartId)

  if ((cart.items ?? []).some((i: any) => i?.metadata?.nemaya_gift_card)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Gift cards can't be used to buy other gift cards.")
  }
  const lines = giftCardLines(cart)
  if (lines.length >= GIFT_CARD_LIMITS.maxPerCart) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `You can use up to ${GIFT_CARD_LIMITS.maxPerCart} gift cards per order.`)
  }

  const card = await giftCards.findByCode(code)
  const reason = giftCards.unusableReason(card as any, cart.currency_code)
  if (reason) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, reason)
  if (lines.some((l: any) => l.reference_id === card!.id)) {
    throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "This gift card is already applied.")
  }

  const outstanding = round2(Number(cart.total ?? 0))
  if (outstanding <= 0) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your order is already fully covered.")
  const amount = round2(Math.min(Number(card!.balance), outstanding))

  await createCartCreditLinesWorkflow(container).run({
    input: [
      {
        cart_id: cartId,
        amount,
        reference: GIFT_CARD_REFERENCE,
        reference_id: card!.id,
        metadata: { code_masked: maskCode(card!.code), balance_before: Number(card!.balance) },
      },
    ],
  })
  return getCartForGiftCards(container, cartId)
}

export async function removeGiftCardFromCart(container: MedusaContainer, cartId: string, creditLineId: string) {
  const cart = await getCartForGiftCards(container, cartId)
  const line = giftCardLines(cart).find((l: any) => l.id === creditLineId)
  if (!line) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Gift card not applied to this cart.")
  await deleteCartCreditLinesWorkflow(container).run({ input: { id: [creditLineId] } })
  return getCartForGiftCards(container, cartId)
}

/**
 * Re-computes gift card credits after the cart changed (items removed, shipping changed…),
 * so credits never exceed what's owed and balances are re-validated.
 */
export async function refreshCartGiftCards(container: MedusaContainer, cartId: string) {
  const giftCards = container.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const cart = await getCartForGiftCards(container, cartId)
  const lines = giftCardLines(cart)
  if (!lines.length) return cart

  let remaining = grossTotal(cart) - Number(cart.credit_line_total ?? 0) + lines.reduce((s: number, l: any) => s + Number(l.amount), 0)
  remaining = round2(Math.max(0, remaining))

  const wanted: { id: string; amount: number; meta: any }[] = []
  for (const l of lines) {
    const card = await giftCards.retrieveGiftCard(l.reference_id).catch(() => null)
    if (!card || giftCards.unusableReason(card as any, cart.currency_code) || remaining <= 0) continue
    const amount = round2(Math.min(Number(card.balance), remaining))
    remaining = round2(remaining - amount)
    wanted.push({ id: card.id, amount, meta: { code_masked: maskCode(card.code), balance_before: Number(card.balance) } })
  }

  const unchanged =
    wanted.length === lines.length && wanted.every((w, i) => w.id === lines[i].reference_id && round2(Number(lines[i].amount)) === w.amount)
  if (unchanged) return cart

  await deleteCartCreditLinesWorkflow(container).run({ input: { id: lines.map((l: any) => l.id) } })
  if (wanted.length) {
    await createCartCreditLinesWorkflow(container).run({
      input: wanted.map((w) => ({ cart_id: cartId, amount: w.amount, reference: GIFT_CARD_REFERENCE, reference_id: w.id, metadata: w.meta })),
    })
  }
  return getCartForGiftCards(container, cartId)
}

/** Validation used by the completeCart hook. Throws if any applied gift card can't cover its credit. */
export async function assertCartGiftCardsValid(container: MedusaContainer, cartId: string) {
  const giftCards = container.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const cart = await getCartForGiftCards(container, cartId)
  for (const l of giftCardLines(cart)) {
    const card = await giftCards.retrieveGiftCard(l.reference_id).catch(() => null)
    const reason = giftCards.unusableReason(card as any, cart.currency_code)
    if (reason) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Gift card ${l.metadata?.code_masked ?? ""}: ${reason}`)
    if (Number(l.amount) > Number(card!.balance) + 0.001) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Gift card ${l.metadata?.code_masked ?? ""} no longer has enough balance. Please re-apply it.`)
    }
  }
  if (Number(cart.total) < -0.001) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Gift card credit exceeds the order total. Please refresh your cart.")
  }
}

// ----------------------------------------------------------------- after order

/** Debits gift cards used on an order and issues gift cards bought in it. Idempotent. */
export async function processOrderGiftCards(container: MedusaContainer, order: any) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const giftCards = container.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)

  // 1) redemptions
  for (const line of (order.credit_lines ?? []).filter((l: any) => l?.reference === GIFT_CARD_REFERENCE)) {
    const already = await giftCards.listGiftCardTransactions(
      { gift_card_id: line.reference_id, order_id: order.id, type: "redeem" } as any,
      { take: 1 }
    )
    if (already.length) continue
    try {
      const updated = await giftCards.redeem(line.reference_id, Number(line.amount), { order_id: order.id })
      const owner = updated.purchaser_customer_id && !updated.recipient_email ? updated.purchaser_customer_id : null
      await notify(container, {
        type: "gift_card_used",
        customerId: order.customer_id ?? owner,
        emails: updated.recipient_email ? [updated.recipient_email] : undefined,
        data: {
          amount: money(line.amount, order.currency_code),
          balance: money(updated.balance, order.currency_code),
          code_masked: maskCode(updated.code),
        },
      })
    } catch (e: any) {
      logger.error(`[gift-card] failed to redeem ${line.reference_id} for order ${order.id}: ${e.message}`)
    }
  }

  // 2) purchases
  for (const item of (order.items ?? []).filter((i: any) => i?.metadata?.nemaya_gift_card)) {
    const existing = await giftCards.listGiftCards({ order_id: order.id, line_item_id: item.id } as any, { take: 50 })
    const toCreate = Number(item.quantity) - existing.length
    const m = item.metadata ?? {}
    for (let n = 0; n < toCreate; n++) {
      const deliverAt = m.deliver_at ? new Date(m.deliver_at as string) : null
      const card = await giftCards.issue({
        amount: Number(item.unit_price),
        currency_code: order.currency_code,
        source: "purchase",
        purchaser_customer_id: order.customer_id ?? null,
        purchaser_email: order.email ?? null,
        sender_name: (m.sender_name as string) || null,
        recipient_name: (m.recipient_name as string) || null,
        recipient_email: (m.recipient_email as string) || order.email,
        message: (m.message as string) || null,
        deliver_at: deliverAt && deliverAt.getTime() > Date.now() ? deliverAt : null,
        order_id: order.id,
        line_item_id: item.id,
      })
      if (!card.deliver_at) await deliverGiftCard(container, card.id)

      await notify(container, {
        type: "gift_card_purchased",
        customerId: order.customer_id ?? null,
        emails: order.customer_id ? undefined : [order.email],
        data: {
          amount: money(card.initial_amount, card.currency_code),
          recipient_name: card.recipient_name || card.recipient_email,
          deliver_on: card.deliver_at ? new Date(card.deliver_at).toDateString() : "today",
        },
      })
    }
  }
}

export async function deliverGiftCard(container: MedusaContainer, giftCardId: string) {
  const giftCards = container.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const card = await giftCards.retrieveGiftCard(giftCardId)
  if (card.delivered_at || !card.recipient_email) return
  await notify(container, {
    type: "gift_card_received",
    emails: [card.recipient_email],
    data: {
      recipient_name: card.recipient_name || "friend",
      sender_name: card.sender_name || "Someone special",
      amount: money(card.initial_amount, card.currency_code),
      code: card.code,
      message: card.message || "Enjoy something you love.",
      redeem_url: `${storeUrl()}/shop`,
      first_name: card.recipient_name || "there",
    },
  })
  await giftCards.updateGiftCards({ id: card.id, delivered_at: new Date() })
}

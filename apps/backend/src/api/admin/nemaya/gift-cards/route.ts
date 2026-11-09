import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GIFT_CARD_MODULE } from "../../../../modules/gift-card"
import type GiftCardModuleService from "../../../../modules/gift-card/service"
import { deliverGiftCard } from "../../../../lib/gift-cards"
import { bad, isEmail, str } from "../../../utils"

/** GET /admin/nemaya/gift-cards?q=&limit=&offset= */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const giftCards = req.scope.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const take = Math.min(Number(req.query.limit ?? 20), 100)
  const skip = Number(req.query.offset ?? 0)
  const q = str(req.query.q, 100)
  const filters: any = q
    ? { $or: [{ code: { $ilike: `%${q}%` } }, { recipient_email: { $ilike: `%${q}%` } }, { purchaser_email: { $ilike: `%${q}%` } }] }
    : {}
  const [gift_cards, count] = await giftCards.listAndCountGiftCards(filters, { take, skip, order: { created_at: "DESC" } })
  res.json({ gift_cards, count, limit: take, offset: skip })
}

/** POST /admin/nemaya/gift-cards — issue a card manually (e.g. compensation). */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const b = (req.body ?? {}) as any
  const amount = Number(b.amount)
  if (!(amount > 0) || amount > 10000) throw bad("Amount must be between 0 and 10,000.")
  const recipientEmail = str(b.recipient_email, 200)?.toLowerCase()
  if (recipientEmail && !isEmail(recipientEmail)) throw bad("Invalid recipient email.")
  const expiresAt = b.expires_at ? new Date(b.expires_at) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) throw bad("Invalid expiry date.")

  const giftCards = req.scope.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const card = await giftCards.issue({
    amount,
    currency_code: str(b.currency_code, 3) ?? "usd",
    source: "admin",
    recipient_email: recipientEmail ?? null,
    recipient_name: str(b.recipient_name, 80) ?? null,
    sender_name: str(b.sender_name, 80) ?? "The Nemaya team",
    message: str(b.message, 500) ?? null,
    expires_at: expiresAt,
    note: str(b.note, 500) ?? null,
    actor_id: req.auth_context?.actor_id,
  })
  if (recipientEmail && b.send_email !== false) await deliverGiftCard(req.scope, card.id)
  res.status(201).json({ gift_card: await giftCards.retrieveGiftCard(card.id) })
}

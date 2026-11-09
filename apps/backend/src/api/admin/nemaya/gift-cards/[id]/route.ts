import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GIFT_CARD_MODULE } from "../../../../../modules/gift-card"
import type GiftCardModuleService from "../../../../../modules/gift-card/service"
import { bad, str } from "../../../../utils"

/** GET /admin/nemaya/gift-cards/:id — with full transaction history. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const giftCards = req.scope.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const gift_card = await giftCards.retrieveGiftCard(req.params.id)
  const transactions = await giftCards.listGiftCardTransactions({ gift_card_id: req.params.id } as any, {
    take: 200,
    order: { created_at: "DESC" },
  })
  res.json({ gift_card, transactions })
}

/**
 * POST /admin/nemaya/gift-cards/:id
 *  { action: "adjust", amount: -10 | 25, reason }
 *  { action: "disable" | "enable", reason? }
 *  { action: "expiry", expires_at: ISO | null }
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const giftCards = req.scope.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const b = (req.body ?? {}) as any
  const actor = req.auth_context?.actor_id
  const reason = str(b.reason, 500)

  switch (b.action) {
    case "adjust": {
      const amount = Number(b.amount)
      if (!Number.isFinite(amount) || amount === 0) throw bad("Enter a non-zero amount.")
      if (!reason) throw bad("A reason is required for balance adjustments.")
      await giftCards.adjust(req.params.id, amount, reason, actor)
      break
    }
    case "disable":
    case "enable":
      await giftCards.setStatus(req.params.id, b.action === "disable" ? "disabled" : "active", reason, actor)
      break
    case "expiry": {
      const expires_at = b.expires_at ? new Date(b.expires_at) : null
      if (expires_at && Number.isNaN(expires_at.getTime())) throw bad("Invalid date.")
      await giftCards.updateGiftCards({ id: req.params.id, expires_at })
      break
    }
    default:
      throw bad("Unknown action.")
  }
  res.json({ gift_card: await giftCards.retrieveGiftCard(req.params.id) })
}

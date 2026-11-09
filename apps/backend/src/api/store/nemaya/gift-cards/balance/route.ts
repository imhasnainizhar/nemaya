import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GIFT_CARD_MODULE } from "../../../../../modules/gift-card"
import type GiftCardModuleService from "../../../../../modules/gift-card/service"
import { maskCode } from "../../../../../modules/gift-card/service"
import { bad, str } from "../../../../utils"

/** POST /store/nemaya/gift-cards/balance { code } */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const code = str((req.body as any)?.code, 40)
  if (!code) throw bad("Enter a gift card code.")
  const giftCards = req.scope.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const card = await giftCards.findByCode(code)
  // small constant delay makes brute-forcing codes slower
  await new Promise((r) => setTimeout(r, 350))
  if (!card) {
    res.status(404).json({ message: "We couldn't find that gift card." })
    return
  }
  res.json({
    code: maskCode(card.code),
    balance: card.balance,
    currency_code: card.currency_code,
    status: card.status,
    expires_at: card.expires_at,
    usable: !giftCards.unusableReason(card as any),
    reason: giftCards.unusableReason(card as any),
  })
}

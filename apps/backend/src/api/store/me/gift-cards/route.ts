import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GIFT_CARD_MODULE } from "../../../../modules/gift-card"
import type GiftCardModuleService from "../../../../modules/gift-card/service"
import { maskCode } from "../../../../modules/gift-card/service"
import { customerIdOf } from "../../../utils"

/** GET /store/me/gift-cards — cards this customer bought or received. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = customerIdOf(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const giftCards = req.scope.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const { data } = await query.graph({ entity: "customer", fields: ["email"], filters: { id: customerId } })
  const email = (data[0] as any)?.email?.toLowerCase()

  const [bought, received] = await Promise.all([
    giftCards.listGiftCards({ purchaser_customer_id: customerId }, { take: 100, order: { created_at: "DESC" } }),
    email ? giftCards.listGiftCards({ recipient_email: email } as any, { take: 100, order: { created_at: "DESC" } }) : [],
  ])

  const shape = (c: any, mine: boolean) => ({
    id: c.id,
    // full code only for cards addressed to this customer
    code: mine ? c.code : maskCode(c.code),
    balance: c.balance,
    initial_amount: c.initial_amount,
    currency_code: c.currency_code,
    status: c.status,
    expires_at: c.expires_at,
    recipient_name: c.recipient_name,
    recipient_email: c.recipient_email,
    sender_name: c.sender_name,
    deliver_at: c.deliver_at,
    delivered_at: c.delivered_at,
    created_at: c.created_at,
  })

  res.json({
    received: received.map((c: any) => shape(c, true)),
    sent: bought.filter((c: any) => c.recipient_email?.toLowerCase() !== email).map((c: any) => shape(c, false)),
  })
}

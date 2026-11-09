import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { GIFT_CARD_LIMITS } from "../../../../../modules/gift-card/service"
import { GIFT_CARD_PRODUCT_HANDLE, GIFT_CARD_REFERENCE } from "../../../../../lib/gift-cards"
import { bad, isEmail, str } from "../../../../utils"

/**
 * POST /store/carts/:id/gift-card-items
 * { amount, recipient_name, recipient_email, sender_name?, message?, deliver_at? }
 * Adds a digital gift card with a custom amount (no shipping required).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = (req.body ?? {}) as Record<string, unknown>
  const amount = Math.round(Number(b.amount) * 100) / 100
  if (!Number.isFinite(amount) || amount < GIFT_CARD_LIMITS.min || amount > GIFT_CARD_LIMITS.max) {
    throw bad(`Gift cards are between $${GIFT_CARD_LIMITS.min} and $${GIFT_CARD_LIMITS.max}.`)
  }
  const recipientEmail = str(b.recipient_email, 200)?.toLowerCase()
  if (!isEmail(recipientEmail)) throw bad("Enter the recipient's email address.")
  const recipientName = str(b.recipient_name, 80)
  if (!recipientName) throw bad("Enter the recipient's name.")

  let deliverAt: string | null = null
  if (b.deliver_at) {
    const d = new Date(String(b.deliver_at))
    if (Number.isNaN(d.getTime())) throw bad("Invalid delivery date.")
    if (d.getTime() > Date.now() + 366 * 24 * 3600_000) throw bad("Delivery date must be within a year.")
    deliverAt = d.getTime() > Date.now() ? d.toISOString() : null
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const [{ data: products }, { data: carts }] = await Promise.all([
    query.graph({ entity: "product", fields: ["id", "thumbnail", "variants.id"], filters: { handle: GIFT_CARD_PRODUCT_HANDLE } }),
    query.graph({ entity: "cart", fields: ["id", "credit_lines.reference"], filters: { id: req.params.id } }),
  ])
  const variantId = (products[0] as any)?.variants?.[0]?.id
  if (!variantId) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Gift cards are not available right now.")
  if (!carts[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found.")
  if (((carts[0] as any).credit_lines ?? []).some((l: any) => l?.reference === GIFT_CARD_REFERENCE)) {
    throw bad("Remove applied gift cards before buying a new one.")
  }

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      items: [
        {
          variant_id: variantId,
          quantity: 1,
          unit_price: amount,
          requires_shipping: false,
          is_discountable: false,
          title: `Nemaya Gift Card · $${amount}`,
          subtitle: `For ${recipientName}`,
          metadata: {
            nemaya_gift_card: true,
            recipient_name: recipientName,
            recipient_email: recipientEmail,
            sender_name: str(b.sender_name, 80) ?? null,
            message: str(b.message, 500) ?? null,
            deliver_at: deliverAt,
          },
        },
      ],
    },
  })

  const { data } = await query.graph({ entity: "cart", fields: ["id", "items.*", "total"], filters: { id: req.params.id } })
  res.json({ cart: data[0] })
}

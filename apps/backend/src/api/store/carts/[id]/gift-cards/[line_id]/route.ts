import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { removeGiftCardFromCart } from "../../../../../../lib/gift-cards"

/** DELETE /store/carts/:id/gift-cards/:line_id */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const cart = await removeGiftCardFromCart(req.scope, req.params.id, req.params.line_id)
  res.json({ cart })
}

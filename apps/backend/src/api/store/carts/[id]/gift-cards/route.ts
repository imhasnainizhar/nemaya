import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { applyGiftCardToCart } from "../../../../../lib/gift-cards"
import { bad, str } from "../../../../utils"

/** POST /store/carts/:id/gift-cards { code } — applies a gift card as a cart credit line. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const code = str((req.body as any)?.code, 40)
  if (!code) throw bad("Enter a gift card code.")
  const cart = await applyGiftCardToCart(req.scope, req.params.id, code)
  res.json({ cart })
}

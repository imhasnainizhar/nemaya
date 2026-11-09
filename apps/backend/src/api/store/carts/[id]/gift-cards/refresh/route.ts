import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refreshCartGiftCards } from "../../../../../../lib/gift-cards"

/** POST /store/carts/:id/gift-cards/refresh — re-balances credits after cart changes. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cart = await refreshCartGiftCards(req.scope, req.params.id)
  res.json({ cart })
}

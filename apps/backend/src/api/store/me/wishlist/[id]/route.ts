import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../../modules/wishlist"
import type WishlistModuleService from "../../../../../modules/wishlist/service"
import { customerIdOf } from "../../../../utils"

/** DELETE /store/me/wishlist/:id — accepts a wishlist item id or a product id. */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = customerIdOf(req)
  const wishlist = req.scope.resolve<WishlistModuleService>(WISHLIST_MODULE)
  const id = req.params.id
  const items = await wishlist.listWishlistItems({ customer_id: customerId }, { take: 500 })
  const match = items.find((i: any) => i.id === id || i.product_id === id)
  if (match) await wishlist.deleteWishlistItems(match.id)
  res.json({ id, deleted: !!match })
}

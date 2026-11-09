import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../../../modules/wishlist"
import type WishlistModuleService from "../../../../modules/wishlist/service"
import { bad, customerIdOf, str } from "../../../utils"

/** GET /store/me/wishlist — product details are fetched by the storefront (region-aware pricing). */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const wishlist = req.scope.resolve<WishlistModuleService>(WISHLIST_MODULE)
  const items = await wishlist.listForCustomer(customerIdOf(req))
  res.json({
    items: items.map((i: any) => ({ id: i.id, product_id: i.product_id, variant_id: i.variant_id, created_at: i.created_at })),
  })
}

/** POST /store/me/wishlist { product_id, variant_id? } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = customerIdOf(req)
  const productId = str((req.body as any)?.product_id, 100)
  const variantId = str((req.body as any)?.variant_id, 100) ?? null
  if (!productId) throw bad("product_id is required.")

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: ["id", "status"], filters: { id: productId } })
  if (!data[0]) throw bad("Product not found.")

  const wishlist = req.scope.resolve<WishlistModuleService>(WISHLIST_MODULE)
  const item = await wishlist.add({ customer_id: customerId, product_id: productId, variant_id: variantId })
  res.json({ item })
}

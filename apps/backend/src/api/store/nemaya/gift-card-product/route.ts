import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GIFT_CARD_LIMITS } from "../../../../modules/gift-card/service"
import { GIFT_CARD_PRODUCT_HANDLE } from "../../../../lib/gift-cards"

/** GET /store/nemaya/gift-card-product — config for the "Buy a gift card" page. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "description", "thumbnail", "variants.id"],
    filters: { handle: GIFT_CARD_PRODUCT_HANDLE },
  })
  const product = data[0] as any
  res.json({
    available: !!product?.variants?.length,
    product: product ? { id: product.id, title: product.title, description: product.description, thumbnail: product.thumbnail } : null,
    ...GIFT_CARD_LIMITS,
  })
}

import { MedusaService } from "@medusajs/framework/utils"
import WishlistItem from "./models/wishlist-item"

class WishlistModuleService extends MedusaService({ WishlistItem }) {
  async listForCustomer(customerId: string) {
    return this.listWishlistItems({ customer_id: customerId }, { order: { created_at: "DESC" }, take: 500 })
  }

  async add(input: {
    customer_id: string
    product_id: string
    variant_id?: string | null
    last_seen_price?: number | null
    currency_code?: string | null
    was_in_stock?: boolean
  }) {
    const [existing] = await this.listWishlistItems(
      { customer_id: input.customer_id, product_id: input.product_id },
      { take: 1 }
    )
    if (existing) {
      return this.updateWishlistItems({
        id: existing.id,
        variant_id: input.variant_id ?? existing.variant_id,
        last_seen_price: input.last_seen_price ?? existing.last_seen_price,
        currency_code: input.currency_code ?? existing.currency_code,
      })
    }
    return this.createWishlistItems({ ...input, was_in_stock: input.was_in_stock ?? true })
  }
}

export default WishlistModuleService

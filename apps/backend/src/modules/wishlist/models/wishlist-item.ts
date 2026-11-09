import { model } from "@medusajs/framework/utils"

const WishlistItem = model
  .define("wishlist_item", {
    id: model.id({ prefix: "wli" }).primaryKey(),
    customer_id: model.text().index(),
    product_id: model.text().index(),
    // optional: a specific size/colour — enables "back in stock" alerts for that variant
    variant_id: model.text().nullable(),
    // price snapshot used for "price drop" alerts (major units, e.g. 59.99)
    last_seen_price: model.float().nullable(),
    currency_code: model.text().nullable(),
    // stock snapshot used for "back in stock" alerts
    was_in_stock: model.boolean().default(true),
    last_alert_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["customer_id", "product_id"], unique: true }])

export default WishlistItem

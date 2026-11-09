import { model } from "@medusajs/framework/utils"
import GiftCardTransaction from "./gift-card-transaction"

const GiftCard = model.define("gift_card", {
  id: model.id({ prefix: "gc" }).primaryKey(),
  code: model.text().unique(),
  currency_code: model.text().default("usd"),
  initial_amount: model.float(),
  balance: model.float(),
  status: model.enum(["active", "disabled"]).default("active"),
  expires_at: model.dateTime().nullable(),
  source: model.enum(["purchase", "admin"]).default("purchase"),

  // purchase / delivery details
  purchaser_customer_id: model.text().nullable(),
  purchaser_email: model.text().nullable(),
  sender_name: model.text().nullable(),
  recipient_name: model.text().nullable(),
  recipient_email: model.text().nullable(),
  message: model.text().nullable(),
  deliver_at: model.dateTime().nullable(),
  delivered_at: model.dateTime().nullable(),
  order_id: model.text().nullable(),
  line_item_id: model.text().nullable(),
  note: model.text().nullable(),

  transactions: model.hasMany(() => GiftCardTransaction, { mappedBy: "gift_card" }),
})

export default GiftCard

import { model } from "@medusajs/framework/utils"
import GiftCard from "./gift-card"

/** Ledger of every balance movement (positive = credit, negative = debit). */
const GiftCardTransaction = model.define("gift_card_transaction", {
  id: model.id({ prefix: "gct" }).primaryKey(),
  type: model.enum(["issue", "redeem", "adjust", "refund", "disable", "enable"]),
  amount: model.float(),
  balance_after: model.float(),
  reason: model.text().nullable(),
  order_id: model.text().nullable(),
  cart_id: model.text().nullable(),
  actor_id: model.text().nullable(),
  gift_card: model.belongsTo(() => GiftCard, { mappedBy: "transactions" }),
})

export default GiftCardTransaction

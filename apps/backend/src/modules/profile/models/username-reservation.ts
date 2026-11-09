import { model } from "@medusajs/framework/utils"

/**
 * When someone changes their username, the old one is held for 30 days so
 * nobody can immediately grab it and impersonate them.
 */
const UsernameReservation = model.define("username_reservation", {
  id: model.id({ prefix: "ures" }).primaryKey(),
  username: model.text().unique(),
  customer_id: model.text(),
  reserved_until: model.dateTime(),
})

export default UsernameReservation

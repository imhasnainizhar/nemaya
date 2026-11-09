import { model } from "@medusajs/framework/utils"

/**
 * Extra customer profile data that Medusa's customer entity doesn't have.
 * One row per customer (customer_id is unique).
 */
const Profile = model.define("profile", {
  id: model.id({ prefix: "prof" }).primaryKey(),
  customer_id: model.text().unique(),
  // always stored lower-case; uniqueness is therefore case-insensitive
  username: model.text().unique(),
  avatar_id: model.text().default("av-01"),
  // ISO timestamps of username changes (used for the "2 changes / 30 days" rule)
  username_changes: model.json().nullable(),
  // last known email — lets us detect email changes on customer.updated
  email_snapshot: model.text().nullable(),
})

export default Profile

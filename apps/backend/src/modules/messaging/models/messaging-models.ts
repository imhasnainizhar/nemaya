import { model } from "@medusajs/framework/utils"

/** Admin overrides for a notification type. Defaults live in catalog.ts. */
export const NotificationSetting = model.define("notification_setting", {
  id: model.id({ prefix: "nset" }).primaryKey(),
  type: model.text().unique(),
  enabled: model.boolean().default(true),
  channels: model.json().nullable(), // { email: boolean, webpush: boolean, inbox: boolean }
  templates: model.json().nullable(), // per-channel template overrides
  config: model.json().nullable(), // e.g. { delay_hours, throttle_hours, threshold }
  updated_by: model.text().nullable(),
})

/** Admin-created broadcast (sale announcement, new drop, …). */
export const Campaign = model.define("notification_campaign", {
  id: model.id({ prefix: "ncmp" }).primaryKey(),
  name: model.text(),
  title: model.text(),
  body: model.text(),
  image_url: model.text().nullable(),
  url: model.text().nullable(),
  email_subject: model.text().nullable(),
  channels: model.json(), // { email, webpush, inbox }
  audience: model.json(), // { type: "all" | "customer_group" | "wishlist_product", value?: string }
  status: model.enum(["draft", "scheduled", "sending", "sent", "canceled", "failed"]).default("draft"),
  scheduled_at: model.dateTime().nullable(),
  sent_at: model.dateTime().nullable(),
  stats: model.json().nullable(), // { recipients, inbox, webpush, email, failed }
  error: model.text().nullable(),
  created_by: model.text().nullable(),
})

/** In-app notification feed (the bell icon). */
export const InboxMessage = model.define("inbox_message", {
  id: model.id({ prefix: "inbx" }).primaryKey(),
  customer_id: model.text().index(),
  type: model.text(),
  category: model.text(),
  title: model.text(),
  body: model.text(),
  url: model.text().nullable(),
  image_url: model.text().nullable(),
  campaign_id: model.text().nullable(),
  read_at: model.dateTime().nullable(),
})

/** Browser Web Push subscription (VAPID). Mobile tokens will live here later too. */
export const PushSubscription = model.define("push_subscription", {
  id: model.id({ prefix: "psub" }).primaryKey(),
  customer_id: model.text().index(),
  endpoint: model.text().unique(),
  p256dh: model.text(),
  auth: model.text(),
  platform: model.text().default("web"),
  user_agent: model.text().nullable(),
  failures: model.number().default(0),
  last_seen_at: model.dateTime().nullable(),
})

/** Devices a customer has signed in from — powers "new login" security alerts. */
export const KnownDevice = model
  .define("known_device", {
    id: model.id({ prefix: "kdev" }).primaryKey(),
    customer_id: model.text().index(),
    fingerprint: model.text(),
    label: model.text().nullable(),
    last_ip: model.text().nullable(),
    last_seen_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["customer_id", "fingerprint"], unique: true }])

/** Customer opt-outs. Security/order types are never opt-out-able. */
export const NotificationPreference = model.define("notification_preference", {
  id: model.id({ prefix: "npref" }).primaryKey(),
  customer_id: model.text().unique(),
  marketing_email: model.boolean().default(true),
  marketing_push: model.boolean().default(true),
  muted_types: model.json().nullable(), // string[] of marketing types the customer muted
})

/** Delivery log — backs the admin "sent / failed" counters. */
export const DeliveryLog = model.define("notification_delivery", {
  id: model.id({ prefix: "ndel" }).primaryKey(),
  type: model.text().index(),
  channel: model.text(),
  status: model.enum(["sent", "failed", "skipped"]),
  customer_id: model.text().nullable(),
  recipient: model.text().nullable(),
  campaign_id: model.text().nullable(),
  error: model.text().nullable(),
})

/** Remembers which Medusa promotion campaigns were already announced. */
export const SaleAnnouncement = model.define("sale_announcement", {
  id: model.id({ prefix: "nsale" }).primaryKey(),
  promotion_campaign_id: model.text().unique(),
})

/**
 * Catalog of every notification Nemaya can send.
 * Admins can override `enabled`, channels and templates from the admin panel,
 * except for LOCKED security types which can never be switched off.
 */

export type Channel = "email" | "webpush" | "inbox"
export const CHANNELS: Channel[] = ["email", "webpush", "inbox"]

export type Category = "security" | "account" | "order" | "gift_card" | "marketing" | "admin"

export type Templates = {
  email?: { subject: string; heading: string; body: string; cta_label?: string; cta_url?: string }
  webpush?: { title: string; body: string; url?: string }
  inbox?: { title: string; body: string; url?: string }
}

export type CatalogEntry = {
  type: string
  category: Category
  label: string
  description: string
  trigger: string
  /** Locked = always enabled and email can't be removed. */
  locked?: boolean
  /** Customers may mute it (marketing only). */
  customer_optional?: boolean
  channels: Record<Channel, boolean>
  available_channels: Channel[]
  templates: Templates
  variables: string[]
  config?: Record<string, number>
}

const ALL: Channel[] = ["email", "webpush", "inbox"]

export const CATALOG: CatalogEntry[] = [
  // ---------------- Security (locked) ----------------
  {
    type: "password_reset",
    category: "security",
    label: "Password reset link",
    description: "Sent when someone requests a password reset. Required for “Forgot password” to work.",
    trigger: "auth.password_reset",
    locked: true,
    channels: { email: true, webpush: false, inbox: false },
    available_channels: ["email"],
    variables: ["first_name", "reset_url"],
    templates: {
      email: {
        subject: "Reset your Nemaya password",
        heading: "Let’s get you back in",
        body: "Hi {{first_name}}, we received a request to reset your password. This link expires in 15 minutes. If you didn’t ask for this, you can safely ignore this email.",
        cta_label: "Choose a new password",
        cta_url: "{{reset_url}}",
      },
    },
  },
  {
    type: "password_changed",
    category: "security",
    label: "Password changed",
    description: "Confirms a password change so the owner can react if it wasn’t them.",
    trigger: "nemaya.password_changed",
    locked: true,
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "changed_at", "support_url"],
    templates: {
      email: {
        subject: "Your Nemaya password was changed",
        heading: "Password updated",
        body: "Hi {{first_name}}, your password was changed on {{changed_at}}. If this wasn’t you, reset your password immediately and contact us.",
        cta_label: "Secure my account",
        cta_url: "{{support_url}}",
      },
      webpush: { title: "Password changed", body: "Your Nemaya password was just changed. Not you? Secure your account.", url: "/account/security" },
      inbox: { title: "Password changed", body: "Your password was changed on {{changed_at}}.", url: "/account/security" },
    },
  },
  {
    type: "email_changed",
    category: "security",
    label: "Email address changed",
    description: "Sent to both the old and new address when the account email changes.",
    trigger: "customer.updated (email diff)",
    locked: true,
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "old_email", "new_email"],
    templates: {
      email: {
        subject: "Your Nemaya email address was changed",
        heading: "Email updated",
        body: "Hi {{first_name}}, the email on your account changed from {{old_email}} to {{new_email}}. If you didn’t do this, contact us right away.",
      },
      webpush: { title: "Email changed", body: "Your account email is now {{new_email}}.", url: "/account/security" },
      inbox: { title: "Email changed", body: "Your account email changed from {{old_email}} to {{new_email}}.", url: "/account/security" },
    },
  },
  {
    type: "new_login",
    category: "security",
    label: "New sign-in from a new device",
    description: "Alerts the customer when their account is accessed from a device we haven’t seen before.",
    trigger: "nemaya.new_device_login",
    locked: true,
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "device", "ip", "time"],
    templates: {
      email: {
        subject: "New sign-in to your Nemaya account",
        heading: "Was this you?",
        body: "Hi {{first_name}}, your account was accessed from {{device}} ({{ip}}) at {{time}}. If this wasn’t you, reset your password now.",
        cta_label: "Review security",
        cta_url: "{{store_url}}/account/security",
      },
      webpush: { title: "New sign-in", body: "Signed in from {{device}}. Not you? Secure your account.", url: "/account/security" },
      inbox: { title: "New sign-in", body: "Your account was accessed from {{device}} at {{time}}.", url: "/account/security" },
    },
  },

  // ---------------- Account ----------------
  {
    type: "welcome",
    category: "account",
    label: "Welcome",
    description: "Greets new customers after sign-up.",
    trigger: "customer.created",
    channels: { email: true, webpush: false, inbox: true },
    available_channels: ["email", "inbox"],
    variables: ["first_name", "username"],
    templates: {
      email: {
        subject: "Welcome to Nemaya, {{first_name}}",
        heading: "Rooted in comfort.",
        body: "Hi @{{username}}, thanks for joining Nemaya. Save pieces to your wishlist and we’ll let you know when they drop in price or come back in stock.",
        cta_label: "Start exploring",
        cta_url: "{{store_url}}/shop",
      },
      inbox: { title: "Welcome to Nemaya 🌿", body: "Your account is ready. Turn on notifications to hear about drops first.", url: "/shop" },
    },
  },

  // ---------------- Orders ----------------
  {
    type: "order_placed",
    category: "order",
    label: "Order confirmed",
    description: "Sent right after checkout.",
    trigger: "order.placed",
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "order_number", "order_total", "order_url"],
    templates: {
      email: {
        subject: "Order #{{order_number}} confirmed",
        heading: "Thank you, {{first_name}}",
        body: "We’ve received your order #{{order_number}} ({{order_total}}). We’ll let you know as soon as it ships.",
        cta_label: "View order",
        cta_url: "{{order_url}}",
      },
      webpush: { title: "Order confirmed", body: "Order #{{order_number}} · {{order_total}}", url: "/account/orders" },
      inbox: { title: "Order #{{order_number}} confirmed", body: "Total {{order_total}}. We’ll notify you when it ships.", url: "/account/orders" },
    },
  },
  {
    type: "order_canceled",
    category: "order",
    label: "Order cancelled",
    description: "Sent when an order is cancelled.",
    trigger: "order.canceled",
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "order_number"],
    templates: {
      email: { subject: "Order #{{order_number}} cancelled", heading: "Your order was cancelled", body: "Hi {{first_name}}, order #{{order_number}} has been cancelled. Any payment will be refunded to the original method." },
      webpush: { title: "Order cancelled", body: "Order #{{order_number}} was cancelled.", url: "/account/orders" },
      inbox: { title: "Order #{{order_number}} cancelled", body: "Any payment will be refunded.", url: "/account/orders" },
    },
  },
  {
    type: "order_shipped",
    category: "order",
    label: "Order shipped",
    description: "Sent when a shipment is created, with tracking when available.",
    trigger: "shipment.created",
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "order_number", "tracking_number", "tracking_url"],
    templates: {
      email: { subject: "Order #{{order_number}} is on its way", heading: "It’s on the move", body: "Hi {{first_name}}, your order #{{order_number}} has shipped. Tracking: {{tracking_number}}.", cta_label: "Track package", cta_url: "{{tracking_url}}" },
      webpush: { title: "Your order shipped 📦", body: "Order #{{order_number}} is on its way.", url: "/account/orders" },
      inbox: { title: "Order #{{order_number}} shipped", body: "Tracking: {{tracking_number}}", url: "/account/orders" },
    },
  },
  {
    type: "order_delivered",
    category: "order",
    label: "Order delivered",
    description: "Sent when a delivery is marked as complete.",
    trigger: "delivery.created",
    channels: { email: false, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "order_number"],
    templates: {
      email: { subject: "Order #{{order_number}} delivered", heading: "Delivered", body: "Hi {{first_name}}, order #{{order_number}} was delivered. Enjoy!" },
      webpush: { title: "Delivered", body: "Order #{{order_number}} has arrived.", url: "/account/orders" },
      inbox: { title: "Order #{{order_number}} delivered", body: "Enjoy your new pieces.", url: "/account/orders" },
    },
  },
  {
    type: "refund_issued",
    category: "order",
    label: "Refund issued",
    description: "Sent when a payment is refunded.",
    trigger: "payment.refunded",
    channels: { email: true, webpush: false, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "order_number"],
    templates: {
      email: { subject: "Refund for order #{{order_number}}", heading: "Refund on its way", body: "Hi {{first_name}}, we’ve issued a refund for order #{{order_number}}. It can take 5–10 business days to appear." },
      webpush: { title: "Refund issued", body: "Refund issued for order #{{order_number}}.", url: "/account/orders" },
      inbox: { title: "Refund issued", body: "Refund for order #{{order_number}} is on its way.", url: "/account/orders" },
    },
  },

  // ---------------- Gift cards ----------------
  {
    type: "gift_card_purchased",
    category: "gift_card",
    label: "Gift card purchase receipt",
    description: "Confirms to the buyer that their gift card was created (and when it’ll be delivered).",
    trigger: "order.placed (gift card items)",
    channels: { email: true, webpush: false, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "amount", "recipient_name", "deliver_on"],
    templates: {
      email: { subject: "Your Nemaya gift card for {{recipient_name}}", heading: "A thoughtful gift", body: "Hi {{first_name}}, your {{amount}} gift card for {{recipient_name}} will be delivered on {{deliver_on}}." },
      inbox: { title: "Gift card scheduled", body: "{{amount}} for {{recipient_name}} · delivers {{deliver_on}}", url: "/account/gift-cards" },
      webpush: { title: "Gift card scheduled", body: "{{amount}} for {{recipient_name}}", url: "/account/gift-cards" },
    },
  },
  {
    type: "gift_card_received",
    category: "gift_card",
    label: "Gift card delivery (recipient)",
    description: "Delivers the gift card code to the recipient — immediately or on the scheduled date.",
    trigger: "gift card delivery job",
    channels: { email: true, webpush: false, inbox: false },
    available_channels: ["email"],
    variables: ["recipient_name", "sender_name", "amount", "code", "message", "redeem_url"],
    templates: {
      email: {
        subject: "{{sender_name}} sent you a Nemaya gift card",
        heading: "A gift for you, {{recipient_name}}",
        body: "{{sender_name}} sent you a {{amount}} Nemaya gift card.\n\n“{{message}}”\n\nYour code: {{code}}",
        cta_label: "Start shopping",
        cta_url: "{{redeem_url}}",
      },
    },
  },
  {
    type: "gift_card_used",
    category: "gift_card",
    label: "Gift card balance used",
    description: "Tells the card owner when their balance is spent (helps spot misuse).",
    trigger: "order.placed (gift card redeemed)",
    channels: { email: true, webpush: false, inbox: true },
    available_channels: ALL,
    variables: ["amount", "balance", "code_masked"],
    templates: {
      email: { subject: "Your gift card was used", heading: "Gift card used", body: "{{amount}} was used from gift card {{code_masked}}. Remaining balance: {{balance}}." },
      inbox: { title: "Gift card used", body: "{{amount}} used · {{balance}} left", url: "/account/gift-cards" },
      webpush: { title: "Gift card used", body: "{{amount}} used · {{balance}} left", url: "/account/gift-cards" },
    },
  },

  // ---------------- Marketing (automated) ----------------
  {
    type: "price_drop",
    category: "marketing",
    label: "Price drop on wishlist item",
    description: "When a wishlisted product gets cheaper.",
    trigger: "hourly job",
    customer_optional: true,
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "product_title", "old_price", "new_price", "product_url"],
    config: { throttle_hours: 24, min_drop_percent: 5 },
    templates: {
      email: { subject: "{{product_title}} just dropped in price", heading: "Good things come to those who wait", body: "{{product_title}} went from {{old_price}} to {{new_price}}.", cta_label: "Shop now", cta_url: "{{product_url}}" },
      webpush: { title: "Price drop 🌿", body: "{{product_title}} is now {{new_price}} (was {{old_price}})", url: "{{product_path}}" },
      inbox: { title: "Price drop: {{product_title}}", body: "Now {{new_price}}, was {{old_price}}.", url: "{{product_path}}" },
    },
  },
  {
    type: "back_in_stock",
    category: "marketing",
    label: "Back in stock",
    description: "When a sold-out wishlisted item (or size) is available again.",
    trigger: "hourly job",
    customer_optional: true,
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["first_name", "product_title", "product_url"],
    config: { throttle_hours: 24 },
    templates: {
      email: { subject: "{{product_title}} is back", heading: "Back in stock", body: "Good news — {{product_title}} is available again. These go fast.", cta_label: "Get yours", cta_url: "{{product_url}}" },
      webpush: { title: "Back in stock", body: "{{product_title}} is available again.", url: "{{product_path}}" },
      inbox: { title: "{{product_title}} is back", body: "Available again — grab it before it’s gone.", url: "{{product_path}}" },
    },
  },
  {
    type: "abandoned_cart",
    category: "marketing",
    label: "Abandoned cart reminder",
    description: "Reminds signed-in customers about items left in their cart.",
    trigger: "job every 30 min",
    customer_optional: true,
    channels: { email: true, webpush: true, inbox: false },
    available_channels: ALL,
    variables: ["first_name", "item_count", "cart_url"],
    config: { delay_hours: 3 },
    templates: {
      email: { subject: "You left something behind", heading: "Still thinking it over?", body: "Hi {{first_name}}, you have {{item_count}} item(s) waiting in your cart.", cta_label: "Return to cart", cta_url: "{{cart_url}}" },
      webpush: { title: "Your cart misses you", body: "{{item_count}} item(s) are waiting.", url: "/cart" },
      inbox: { title: "Items in your cart", body: "{{item_count}} item(s) are waiting.", url: "/cart" },
    },
  },
  {
    type: "sale_started",
    category: "marketing",
    label: "Sale started (promotion campaign)",
    description: "Announces a Medusa promotion campaign automatically when it starts.",
    trigger: "job every 5 min",
    customer_optional: true,
    channels: { email: false, webpush: true, inbox: true },
    available_channels: ALL,
    variables: ["campaign_name", "campaign_description", "sale_url"],
    templates: {
      email: { subject: "{{campaign_name}} is live", heading: "{{campaign_name}}", body: "{{campaign_description}}", cta_label: "Shop the sale", cta_url: "{{sale_url}}" },
      webpush: { title: "{{campaign_name}} is live", body: "{{campaign_description}}", url: "/shop?sale=1" },
      inbox: { title: "{{campaign_name}} is live", body: "{{campaign_description}}", url: "/shop?sale=1" },
    },
  },
  {
    type: "campaign",
    category: "marketing",
    label: "Admin broadcasts",
    description: "Master switch for campaigns created in Notifications → Campaigns.",
    trigger: "admin campaign",
    customer_optional: true,
    channels: { email: true, webpush: true, inbox: true },
    available_channels: ALL,
    variables: [],
    templates: {},
  },

  // ---------------- Admin alerts ----------------
  {
    type: "admin_new_order",
    category: "admin",
    label: "Admin: new order",
    description: "Emails the addresses in ADMIN_ALERT_EMAILS when an order is placed.",
    trigger: "order.placed",
    channels: { email: true, webpush: false, inbox: false },
    available_channels: ["email"],
    variables: ["order_number", "order_total", "customer_email", "admin_url"],
    templates: {
      email: { subject: "New order #{{order_number}} · {{order_total}}", heading: "New order", body: "Order #{{order_number}} from {{customer_email}} — {{order_total}}.", cta_label: "Open in admin", cta_url: "{{admin_url}}" },
    },
  },
]

export const CATALOG_BY_TYPE = Object.fromEntries(CATALOG.map((c) => [c.type, c])) as Record<string, CatalogEntry>

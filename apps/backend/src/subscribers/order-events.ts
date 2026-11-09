import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { adminUrl, money, notify, storeUrl } from "../lib/notify"
import { processOrderGiftCards } from "../lib/gift-cards"

const ORDER_FIELDS = [
  "id",
  "display_id",
  "email",
  "customer_id",
  "currency_code",
  "total",
  "items.id",
  "items.quantity",
  "items.unit_price",
  "items.metadata",
  "credit_lines.id",
  "credit_lines.amount",
  "credit_lines.reference",
  "credit_lines.reference_id",
  "shipping_address.first_name",
]

export default async function orderEvents({ event, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "order", fields: ORDER_FIELDS, filters: { id: event.data.id } })
  const order = data[0] as any
  if (!order) return

  const common = {
    order_number: order.display_id,
    order_total: money(order.total, order.currency_code),
    order_url: `${storeUrl()}/account/orders/${order.id}`,
    first_name: order.shipping_address?.first_name || undefined,
  }

  if (event.name === "order.placed") {
    // gift cards first so balances are correct before any other email goes out
    await processOrderGiftCards(container, order)

    await notify(container, {
      type: "order_placed",
      customerId: order.customer_id,
      emails: [order.email],
      data: common,
      resourceId: order.id,
    })

    const admins = (process.env.ADMIN_ALERT_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean)
    if (admins.length) {
      await notify(container, {
        type: "admin_new_order",
        emails: admins,
        data: { ...common, customer_email: order.email, admin_url: `${adminUrl()}/orders/${order.id}` },
      })
    }
  }

  if (event.name === "order.canceled") {
    await notify(container, { type: "order_canceled", customerId: order.customer_id, emails: [order.email], data: common })
  }
}

export const config: SubscriberConfig = { event: ["order.placed", "order.canceled"] }

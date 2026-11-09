import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { notify } from "../lib/notify"

/** shipment.created / delivery.created carry a fulfillment id. */
export default async function fulfillmentEvents({ event, container }: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (event.data.no_notification) return
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { data } = await query.graph({
      entity: "fulfillment",
      fields: ["id", "labels.tracking_number", "labels.tracking_url", "order.id", "order.display_id", "order.email", "order.customer_id"],
      filters: { id: event.data.id },
    })
    const f = data[0] as any
    const order = f?.order
    if (!order) return
    const label = f.labels?.[0]
    const vars = {
      order_number: order.display_id,
      tracking_number: label?.tracking_number || "will be shared soon",
      tracking_url: label?.tracking_url || "",
    }
    await notify(container, {
      type: event.name === "shipment.created" ? "order_shipped" : "order_delivered",
      customerId: order.customer_id,
      emails: [order.email],
      data: vars,
    })
  } catch (e: any) {
    logger.warn(`[notify] ${event.name} lookup failed: ${e.message}`)
  }
}

export const config: SubscriberConfig = { event: ["shipment.created", "delivery.created"] }

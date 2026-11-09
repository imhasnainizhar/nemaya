import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { notify } from "../lib/notify"

export default async function paymentRefunded({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const { data: payments } = await query.graph({
      entity: "payment",
      fields: ["id", "payment_collection.order.id", "payment_collection.order.display_id", "payment_collection.order.email", "payment_collection.order.customer_id"],
      filters: { id: data.id },
    })
    const order = (payments[0] as any)?.payment_collection?.order
    if (!order) return
    await notify(container, {
      type: "refund_issued",
      customerId: order.customer_id,
      emails: [order.email],
      data: { order_number: order.display_id },
    })
  } catch (e: any) {
    logger.warn(`[notify] payment.refunded lookup failed: ${e.message}`)
  }
}

export const config: SubscriberConfig = { event: "payment.refunded" }

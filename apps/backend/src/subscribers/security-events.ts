import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { notify } from "../lib/notify"

type Payload = {
  customer_id?: string | null
  email: string
  device?: string
  ip?: string
  time?: string
}

/** Custom events emitted by our auth middlewares (see src/api/middlewares.ts). */
export default async function securityEvents({ event, container }: SubscriberArgs<Payload>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const data = event.data
  let customerId = data.customer_id ?? null
  if (!customerId && data.email) {
    const { data: rows } = await query.graph({ entity: "customer", fields: ["id"], filters: { email: data.email, has_account: true } })
    customerId = rows[0]?.id ?? null
  }

  const when = new Date(data.time ?? Date.now()).toUTCString()
  if (event.name === "nemaya.password_changed") {
    await notify(container, { type: "password_changed", customerId, emails: [data.email], data: { changed_at: when } })
  }
  if (event.name === "nemaya.new_device_login") {
    await notify(container, {
      type: "new_login",
      customerId,
      emails: [data.email],
      data: { device: data.device ?? "an unknown device", ip: data.ip ?? "unknown IP", time: when },
    })
  }
}

export const config: SubscriberConfig = { event: ["nemaya.password_changed", "nemaya.new_device_login"] }

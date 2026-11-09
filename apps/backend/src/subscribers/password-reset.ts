import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { adminUrl, notify, storeUrl } from "../lib/notify"

type Payload = { entity_id: string; actor_type: string; token: string }

/** LOCKED: always sent — "forgot password" depends on it. */
export default async function passwordReset({ event: { data }, container }: SubscriberArgs<Payload>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const email = data.entity_id
  const qs = `token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(email)}`

  if (data.actor_type === "customer") {
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name"],
      filters: { email, has_account: true },
    })
    await notify(container, {
      type: "password_reset",
      customerId: customers[0]?.id ?? null,
      emails: [email],
      data: { reset_url: `${storeUrl()}/reset-password?${qs}`, first_name: customers[0]?.first_name || "there" },
    })
  } else if (data.actor_type === "user") {
    await notify(container, {
      type: "password_reset",
      emails: [email],
      data: { reset_url: `${adminUrl()}/reset-password?${qs}`, first_name: "there" },
    })
  }
}

export const config: SubscriberConfig = { event: "auth.password_reset" }

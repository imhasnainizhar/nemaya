import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { notify } from "../lib/notify"
import { PROFILE_MODULE } from "../modules/profile"
import type ProfileModuleService from "../modules/profile/service"

/** Detects account email changes (LOCKED security notification to old + new address). */
export default async function customerUpdated({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const profiles = container.resolve<ProfileModuleService>(PROFILE_MODULE)
  const { data: rows } = await query.graph({ entity: "customer", fields: ["id", "email"], filters: { id: data.id } })
  const customer = rows[0]
  const profile = await profiles.getByCustomerId(data.id)
  if (!customer || !profile) return

  const oldEmail = profile.email_snapshot
  if (oldEmail && customer.email && oldEmail.toLowerCase() !== customer.email.toLowerCase()) {
    await notify(container, {
      type: "email_changed",
      customerId: customer.id,
      emails: [oldEmail, customer.email],
      data: { old_email: oldEmail, new_email: customer.email },
    })
  }
  if (customer.email && customer.email !== oldEmail) {
    await profiles.updateProfiles({ id: profile.id, email_snapshot: customer.email })
  }
}

export const config: SubscriberConfig = { event: "customer.updated" }

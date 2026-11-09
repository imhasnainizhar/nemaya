import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { notify } from "../lib/notify"
import { PROFILE_MODULE } from "../modules/profile"
import type ProfileModuleService from "../modules/profile/service"

export default async function customerCreated({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const profiles = container.resolve<ProfileModuleService>(PROFILE_MODULE)
  // the storefront creates the profile right after the customer — give it a moment
  let profile = await profiles.getByCustomerId(data.id)
  for (let i = 0; !profile && i < 5; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    profile = await profiles.getByCustomerId(data.id)
  }
  await notify(container, {
    type: "welcome",
    customerId: data.id,
    data: { username: profile?.username ?? "friend" },
  })
}

export const config: SubscriberConfig = { event: "customer.created" }

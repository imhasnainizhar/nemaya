import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MESSAGING_MODULE } from "../modules/messaging"
import type MessagingModuleService from "../modules/messaging/service"
import { notify, storeUrl } from "../lib/notify"

/** Reminds signed-in customers about carts left untouched for `delay_hours`. */
export default async function abandonedCarts(container: MedusaContainer) {
  const messaging = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const setting = await messaging.getSetting("abandoned_cart")
  if (!setting.enabled) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cartModule = container.resolve(Modules.CART)
  const delayH = Number(setting.config.delay_hours ?? 3)
  const olderThan = new Date(Date.now() - delayH * 3600_000)
  const notOlderThan = new Date(Date.now() - (delayH + 48) * 3600_000)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id", "email", "metadata", "completed_at", "updated_at", "items.id", "items.quantity"],
    filters: {
      completed_at: null,
      customer_id: { $ne: null },
      updated_at: { $lte: olderThan, $gte: notOlderThan },
    } as any,
    pagination: { take: 200 },
  })

  for (const cart of carts as any[]) {
    if (!cart.items?.length || cart.metadata?.nemaya_abandoned_notified_at) continue
    const count = cart.items.reduce((s: number, i: any) => s + Number(i.quantity ?? 0), 0)
    await notify(container, {
      type: "abandoned_cart",
      customerId: cart.customer_id,
      data: { item_count: count, cart_url: `${storeUrl()}/cart` },
    })
    await cartModule.updateCarts(cart.id, {
      metadata: { ...(cart.metadata ?? {}), nemaya_abandoned_notified_at: new Date().toISOString() },
    })
  }
}

export const config = { name: "nemaya-abandoned-carts", schedule: "*/30 * * * *" }

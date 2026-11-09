import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MESSAGING_MODULE } from "../modules/messaging"
import type MessagingModuleService from "../modules/messaging/service"
import { notify, storeUrl } from "../lib/notify"
import { resolveAudience } from "../lib/campaigns"

/**
 * Announces Medusa promotion campaigns (Promotions → Campaigns in admin)
 * once their start date has passed. Each campaign is announced only once.
 */
export default async function saleStarted(container: MedusaContainer) {
  const messaging = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const setting = await messaging.getSetting("sale_started")
  if (!setting.enabled) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date()
  const { data: campaigns } = await query.graph({
    entity: "campaign",
    fields: ["id", "name", "description", "starts_at", "ends_at"],
    filters: { starts_at: { $lte: now, $gte: new Date(now.getTime() - 24 * 3600_000) } } as any,
  })

  for (const c of campaigns as any[]) {
    if (c.ends_at && new Date(c.ends_at) < now) continue
    const [done] = await messaging.listSaleAnnouncements({ promotion_campaign_id: c.id }, { take: 1 })
    if (done) continue
    await messaging.createSaleAnnouncements({ promotion_campaign_id: c.id })

    const customers = await resolveAudience(container, { type: "all" })
    for (const customerId of customers) {
      await notify(container, {
        type: "sale_started",
        customerId,
        data: {
          campaign_name: c.name,
          campaign_description: c.description || "Limited-time prices across the store.",
          sale_url: `${storeUrl()}/shop?sale=1`,
        },
      })
    }
  }
}

export const config = { name: "nemaya-sale-started", schedule: "*/5 * * * *" }

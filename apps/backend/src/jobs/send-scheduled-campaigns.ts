import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MESSAGING_MODULE } from "../modules/messaging"
import type MessagingModuleService from "../modules/messaging/service"
import { sendCampaign } from "../lib/campaigns"

export default async function sendScheduledCampaigns(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const messaging = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const due = await messaging.listCampaigns({ status: "scheduled", scheduled_at: { $lte: new Date() } } as any, { take: 10 })
  for (const c of due as any[]) {
    try {
      const stats = await sendCampaign(container, c.id)
      logger.info(`[campaign] "${c.name}" sent: ${JSON.stringify(stats)}`)
    } catch (e: any) {
      logger.error(`[campaign] "${c.name}" failed: ${e.message}`)
    }
  }
}

export const config = { name: "nemaya-send-scheduled-campaigns", schedule: "* * * * *" }

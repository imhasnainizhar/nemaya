import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MESSAGING_MODULE } from "../../../../../../modules/messaging"
import type MessagingModuleService from "../../../../../../modules/messaging/service"
import { sendCampaign } from "../../../../../../lib/campaigns"

/** POST /admin/nemaya/campaigns/:id/send — send now (runs in the background). */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const campaign: any = await messaging.retrieveCampaign(req.params.id)
  if (!["draft", "scheduled", "failed"].includes(campaign.status)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Campaign is ${campaign.status}.`)
  }
  const master = await messaging.getSetting("campaign")
  if (!master.enabled) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Admin broadcasts are switched off in Notification settings.")

  const container = req.scope
  setImmediate(() => {
    sendCampaign(container, campaign.id).catch((e) => logger.error(`[campaign] ${campaign.id} failed: ${e.message}`))
  })
  res.status(202).json({ id: campaign.id, status: "sending" })
}

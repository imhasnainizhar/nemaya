import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MESSAGING_MODULE } from "../../../../../modules/messaging"
import type MessagingModuleService from "../../../../../modules/messaging/service"
import { parseCampaignBody } from "../validate"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  res.json({ campaign: await messaging.retrieveCampaign(req.params.id) })
}

/** POST /admin/nemaya/campaigns/:id — edit a draft/scheduled campaign. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const current: any = await messaging.retrieveCampaign(req.params.id)
  if (!["draft", "scheduled", "failed", "canceled"].includes(current.status)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `A ${current.status} campaign can't be edited.`)
  }
  const data = parseCampaignBody(req.body ?? {}, true)
  const campaign = await messaging.updateCampaigns({ id: current.id, ...data } as any)
  res.json({ campaign })
}

/** DELETE /admin/nemaya/campaigns/:id — cancel if scheduled, delete if draft. */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const current: any = await messaging.retrieveCampaign(req.params.id)
  if (current.status === "scheduled") {
    await messaging.updateCampaigns({ id: current.id, status: "canceled" } as any)
    res.json({ id: current.id, canceled: true })
    return
  }
  if (current.status === "sending") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Campaign is sending.")
  await messaging.deleteCampaigns(current.id)
  res.json({ id: current.id, deleted: true })
}

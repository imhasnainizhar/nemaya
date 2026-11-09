import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { parseCampaignBody } from "./validate"

/** GET /admin/nemaya/campaigns */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const take = Math.min(Number(req.query.limit ?? 50), 100)
  const skip = Number(req.query.offset ?? 0)
  const [campaigns, count] = await messaging.listAndCountCampaigns({}, { take, skip, order: { created_at: "DESC" } })
  res.json({ campaigns, count, limit: take, offset: skip })
}

/** POST /admin/nemaya/campaigns — create a draft or scheduled campaign. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const data = parseCampaignBody(req.body ?? {})
  const campaign = await messaging.createCampaigns({
    status: "draft",
    ...data,
    created_by: req.auth_context?.actor_id ?? null,
  } as any)
  res.status(201).json({ campaign })
}

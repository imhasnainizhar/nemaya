import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { sendCampaign } from "../../../../../../lib/campaigns"

/** POST /admin/nemaya/campaigns/:id/test — emails a preview to the signed-in admin. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const userModule = req.scope.resolve(Modules.USER)
  const user = await userModule.retrieveUser(req.auth_context.actor_id)
  if (!user?.email) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Your admin user has no email.")
  await sendCampaign(req.scope, req.params.id, { testEmail: user.email })
  res.json({ sent_to: user.email })
}

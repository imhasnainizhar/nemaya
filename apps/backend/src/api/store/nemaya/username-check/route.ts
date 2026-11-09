import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PROFILE_MODULE } from "../../../../modules/profile"
import type ProfileModuleService from "../../../../modules/profile/service"

/** GET /store/nemaya/username-check?username=foo */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const profiles = req.scope.resolve<ProfileModuleService>(PROFILE_MODULE)
  const result = await profiles.isUsernameAvailable(String(req.query.username ?? ""))
  res.json(result)
}

import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getAvatar } from "@nemaya/avatars"
import { PROFILE_MODULE } from "../../../../../../modules/profile"
import type ProfileModuleService from "../../../../../../modules/profile/service"
import { MESSAGING_MODULE } from "../../../../../../modules/messaging"
import type MessagingModuleService from "../../../../../../modules/messaging/service"

/** GET /admin/nemaya/customers/:id/profile — used by the customer details widget. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const profiles = req.scope.resolve<ProfileModuleService>(PROFILE_MODULE)
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const [profile, devices, subs] = await Promise.all([
    profiles.getByCustomerId(req.params.id),
    messaging.listKnownDevices({ customer_id: req.params.id }, { take: 20, order: { last_seen_at: "DESC" } }),
    messaging.listPushSubscriptions({ customer_id: req.params.id }, { take: 20, select: ["id"] }),
  ])
  res.json({
    profile: profile
      ? {
          username: profile.username,
          avatar_id: profile.avatar_id,
          avatar_svg: getAvatar(profile.avatar_id).svg,
          quota: profiles.usernameQuota(profile),
        }
      : null,
    devices,
    push_subscriptions: subs.length,
  })
}

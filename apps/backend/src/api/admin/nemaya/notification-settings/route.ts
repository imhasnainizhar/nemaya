import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"

/** GET /admin/nemaya/notification-settings — every notification type with effective settings + 30-day stats. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const [settings, stats] = await Promise.all([messaging.listResolvedSettings(), messaging.deliveryStats()])
  res.json({
    settings: settings.map((s) => ({ ...s, stats: stats[s.type] ?? { sent: 0, failed: 0 } })),
    push_configured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  })
}

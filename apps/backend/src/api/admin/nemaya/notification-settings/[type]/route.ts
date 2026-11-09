import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MESSAGING_MODULE } from "../../../../../modules/messaging"
import type MessagingModuleService from "../../../../../modules/messaging/service"

/** POST /admin/nemaya/notification-settings/:type { enabled?, channels?, templates?, config? } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const b = (req.body ?? {}) as any
  const setting = await messaging.updateSetting(
    req.params.type,
    {
      enabled: typeof b.enabled === "boolean" ? b.enabled : undefined,
      channels: b.channels && typeof b.channels === "object" ? b.channels : undefined,
      templates: b.templates && typeof b.templates === "object" ? b.templates : undefined,
      config: b.config && typeof b.config === "object" ? b.config : undefined,
    },
    req.auth_context?.actor_id
  )
  res.json({ setting })
}

/** DELETE /admin/nemaya/notification-settings/:type — reset to defaults. */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  res.json({ setting: await messaging.resetSetting(req.params.type) })
}

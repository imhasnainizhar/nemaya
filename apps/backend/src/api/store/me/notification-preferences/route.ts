import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { CATALOG } from "../../../../modules/messaging/catalog"
import { customerIdOf } from "../../../utils"

const optionalTypes = () =>
  CATALOG.filter((c) => c.customer_optional).map((c) => ({ type: c.type, label: c.label, description: c.description }))

/** GET /store/me/notification-preferences */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const preferences = await messaging.getPreferences(customerIdOf(req))
  const devices = await messaging.listPushSubscriptions({ customer_id: customerIdOf(req) }, { take: 20, select: ["id", "user_agent", "created_at"] })
  res.json({ preferences, optional_types: optionalTypes(), push_devices: devices })
}

/** POST /store/me/notification-preferences { marketing_email?, marketing_push?, muted_types? } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const b = (req.body ?? {}) as any
  const preferences = await messaging.setPreferences(customerIdOf(req), {
    marketing_email: typeof b.marketing_email === "boolean" ? b.marketing_email : undefined,
    marketing_push: typeof b.marketing_push === "boolean" ? b.marketing_push : undefined,
    muted_types: Array.isArray(b.muted_types) ? b.muted_types.map(String) : undefined,
  })
  res.json({ preferences, optional_types: optionalTypes() })
}

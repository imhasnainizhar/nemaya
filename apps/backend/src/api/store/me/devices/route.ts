import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { customerIdOf } from "../../../utils"

/** GET /store/me/devices — devices this account has signed in from. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const devices = await messaging.listKnownDevices({ customer_id: customerIdOf(req) }, { take: 20, order: { last_seen_at: "DESC" } })
  res.json({ devices: devices.map((d: any) => ({ id: d.id, label: d.label, last_ip: d.last_ip, last_seen_at: d.last_seen_at, created_at: d.created_at })) })
}

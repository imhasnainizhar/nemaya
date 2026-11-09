import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { customerIdOf } from "../../../utils"

/** GET /store/me/notifications?limit=20&offset=0 — in-app inbox. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = customerIdOf(req)
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const take = Math.min(Number(req.query.limit ?? 20), 50)
  const skip = Number(req.query.offset ?? 0)
  const [messages, count] = await messaging.listAndCountInboxMessages(
    { customer_id: customerId },
    { take, skip, order: { created_at: "DESC" } }
  )
  const unread = await messaging.listInboxMessages({ customer_id: customerId, read_at: null } as any, { take: 100, select: ["id"] })
  res.json({ messages, count, unread_count: unread.length, limit: take, offset: skip })
}

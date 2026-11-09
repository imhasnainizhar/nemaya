import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MESSAGING_MODULE } from "../../../../../modules/messaging"
import type MessagingModuleService from "../../../../../modules/messaging/service"
import { customerIdOf } from "../../../../utils"

/** POST /store/me/notifications/read { ids?: string[], all?: boolean } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = customerIdOf(req)
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const body = (req.body ?? {}) as { ids?: string[]; all?: boolean }

  const filters: any = { customer_id: customerId, read_at: null }
  if (!body.all) filters.id = Array.isArray(body.ids) ? body.ids.slice(0, 100) : []
  const unread = await messaging.listInboxMessages(filters, { take: 500, select: ["id"] })
  if (unread.length) {
    const now = new Date()
    await messaging.updateInboxMessages(unread.map((m: any) => ({ id: m.id, read_at: now })))
  }
  res.json({ updated: unread.length })
}

import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { bad, customerIdOf } from "../../../utils"

/** POST /store/me/push-subscriptions { subscription: PushSubscriptionJSON } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const sub = (req.body as any)?.subscription
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) throw bad("Invalid push subscription.")
  if (!/^https:\/\//.test(sub.endpoint)) throw bad("Invalid push endpoint.")
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const ua = String(req.headers["x-nemaya-client-ua"] ?? req.headers["user-agent"] ?? "").slice(0, 300)
  await messaging.upsertPushSubscription(customerIdOf(req), sub, ua)
  res.json({ subscribed: true })
}

/** DELETE /store/me/push-subscriptions { endpoint } */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const endpoint = (req.body as any)?.endpoint ?? req.query.endpoint
  const messaging = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const subs = await messaging.listPushSubscriptions({ customer_id: customerIdOf(req), ...(endpoint ? { endpoint: String(endpoint) } : {}) }, { take: 50 })
  if (subs.length) await messaging.deletePushSubscriptions(subs.map((s: any) => s.id))
  res.json({ removed: subs.length })
}

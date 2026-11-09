import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MESSAGING_MODULE } from "../modules/messaging"
import type MessagingModuleService from "../modules/messaging/service"
import { interpolate, renderEmail } from "./render"

export const storeUrl = () => (process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, "")
export const adminUrl = () => `${(process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}/app`

export const money = (amount: number | string | null | undefined, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(Number(amount ?? 0))

type NotifyInput = {
  type: string
  customerId?: string | null
  /** Explicit email recipients (e.g. gift card recipient, old address). Defaults to the customer's email. */
  emails?: string[]
  data?: Record<string, unknown>
  campaignId?: string
  /** Skip customer preference checks (used for explicit transactional sends). */
  ignorePreferences?: boolean
  resourceId?: string
}

/**
 * Central dispatcher: every notification goes through here so admin switches,
 * locked types, channel toggles, templates and customer preferences are always respected.
 */
export async function notify(container: MedusaContainer, input: NotifyInput) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const messaging = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const notifications = container.resolve(Modules.NOTIFICATION)

  try {
    const setting = await messaging.getSetting(input.type)
    if (!setting.enabled) {
      await messaging.createDeliveryLogs({ type: input.type, channel: "all", status: "skipped", customer_id: input.customerId ?? null, error: "disabled by admin" } as any)
      return
    }

    let customer: any = null
    if (input.customerId) {
      const { data } = await query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name", "last_name", "has_account"],
        filters: { id: input.customerId },
      })
      customer = data[0] ?? null
    }

    const prefs = input.customerId && !input.ignorePreferences ? await messaging.getPreferences(input.customerId) : null
    const marketing = !!setting.customer_optional
    if (marketing && prefs?.muted_types?.includes?.(input.type)) return

    const vars: Record<string, unknown> = {
      store_url: storeUrl(),
      support_url: `${storeUrl()}/account/security`,
      first_name: customer?.first_name || (input.data?.first_name as string) || "there",
      ...input.data,
    }

    const log = (channel: string, status: "sent" | "failed" | "skipped", recipient?: string, error?: string) =>
      messaging
        .createDeliveryLogs({
          type: input.type,
          channel,
          status,
          customer_id: input.customerId ?? null,
          recipient: recipient ?? null,
          campaign_id: input.campaignId ?? null,
          error: error?.slice(0, 500) ?? null,
        } as any)
        .catch(() => undefined)

    // ---------- email ----------
    const emailTpl = setting.templates.email
    if (setting.channels.email && emailTpl) {
      const recipients = input.emails?.length ? input.emails : customer?.email ? [customer.email] : []
      const allowed = !marketing || !prefs || prefs.marketing_email !== false
      if (allowed) {
        const content = renderEmail(emailTpl, vars)
        for (const to of recipients) {
          try {
            await notifications.createNotifications({
              to,
              channel: "email",
              template: input.type,
              content,
              trigger_type: input.type,
              receiver_id: input.customerId ?? null,
              resource_id: input.resourceId ?? null,
            })
            await log("email", "sent", to)
          } catch (e: any) {
            logger.warn(`[notify] email ${input.type} → ${to} failed: ${e.message}`)
            await log("email", "failed", to, e.message)
          }
        }
      }
    }

    // ---------- inbox ----------
    const inboxTpl = setting.templates.inbox
    if (setting.channels.inbox && inboxTpl && input.customerId) {
      await messaging.createInboxMessages({
        customer_id: input.customerId,
        type: input.type,
        category: setting.category,
        title: interpolate(inboxTpl.title, vars),
        body: interpolate(inboxTpl.body, vars),
        url: interpolate(inboxTpl.url, vars) || null,
        image_url: (input.data?.image_url as string) ?? null,
        campaign_id: input.campaignId ?? null,
      } as any)
      await log("inbox", "sent", input.customerId)
    }

    // ---------- web push ----------
    const pushTpl = setting.templates.webpush
    if (setting.channels.webpush && pushTpl && input.customerId) {
      const allowed = !marketing || !prefs || prefs.marketing_push !== false
      if (allowed) {
        await sendPush(container, input.customerId, {
          type: input.type,
          title: interpolate(pushTpl.title, vars),
          body: interpolate(pushTpl.body, vars),
          url: interpolate(pushTpl.url, vars) || "/",
          image_url: (input.data?.image_url as string) ?? undefined,
          campaignId: input.campaignId,
        })
      }
    }
  } catch (e: any) {
    logger.error(`[notify] ${input.type} failed: ${e.message}`)
  }
}

export async function sendPush(
  container: MedusaContainer,
  customerId: string,
  msg: { type: string; title: string; body: string; url: string; image_url?: string; campaignId?: string }
) {
  const messaging = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const notifications = container.resolve(Modules.NOTIFICATION)
  const subs = await messaging.listPushSubscriptions({ customer_id: customerId }, { take: 20 })
  let sent = 0
  for (const sub of subs as any[]) {
    try {
      await notifications.createNotifications({
        to: sub.endpoint,
        channel: "webpush",
        template: msg.type,
        content: { subject: msg.title, text: msg.body },
        data: { url: msg.url, image_url: msg.image_url },
        provider_data: { p256dh: sub.p256dh, auth: sub.auth },
        trigger_type: msg.type,
        receiver_id: customerId,
      })
      sent++
      await messaging.createDeliveryLogs({ type: msg.type, channel: "webpush", status: "sent", customer_id: customerId, campaign_id: msg.campaignId ?? null } as any)
    } catch (e: any) {
      const gone = /webpush (404|410)/.test(e.message ?? "")
      if (gone || sub.failures >= 4) await messaging.deletePushSubscriptions(sub.id)
      else await messaging.updatePushSubscriptions({ id: sub.id, failures: (sub.failures ?? 0) + 1 })
      await messaging.createDeliveryLogs({ type: msg.type, channel: "webpush", status: "failed", customer_id: customerId, campaign_id: msg.campaignId ?? null, error: String(e.message).slice(0, 500) } as any)
    }
  }
  return sent
}

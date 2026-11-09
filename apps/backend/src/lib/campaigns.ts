import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MESSAGING_MODULE } from "../modules/messaging"
import type MessagingModuleService from "../modules/messaging/service"
import { WISHLIST_MODULE } from "../modules/wishlist"
import type WishlistModuleService from "../modules/wishlist/service"
import { renderEmail } from "./render"
import { sendPush, storeUrl } from "./notify"

export type Audience = { type: "all" | "customer_group" | "wishlist_product"; value?: string | null }

export async function resolveAudience(container: MedusaContainer, audience: Audience): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  if (audience.type === "customer_group" && audience.value) {
    const { data } = await query.graph({ entity: "customer_group", fields: ["id", "customers.id"], filters: { id: audience.value } })
    return ((data[0] as any)?.customers ?? []).map((c: any) => c.id)
  }
  if (audience.type === "wishlist_product" && audience.value) {
    const wishlist = container.resolve<WishlistModuleService>(WISHLIST_MODULE)
    const items = await wishlist.listWishlistItems({ product_id: audience.value }, { take: 10000, select: ["customer_id"] })
    return [...new Set(items.map((i: any) => i.customer_id))]
  }
  const ids: string[] = []
  const take = 500
  for (let skip = 0; ; skip += take) {
    const { data } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { has_account: true },
      pagination: { skip, take },
    })
    ids.push(...data.map((c: any) => c.id))
    if (data.length < take) break
  }
  return ids
}

/** Sends (or test-sends) an admin campaign. */
export async function sendCampaign(container: MedusaContainer, campaignId: string, opts: { testEmail?: string } = {}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const messaging = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const notifications = container.resolve(Modules.NOTIFICATION)

  const campaign: any = await messaging.retrieveCampaign(campaignId)
  const master = await messaging.getSetting("campaign")
  const channels = {
    email: !!campaign.channels?.email && master.channels.email,
    webpush: !!campaign.channels?.webpush && master.channels.webpush,
    inbox: !!campaign.channels?.inbox && master.channels.inbox,
  }

  const url = campaign.url || "/shop"
  const absoluteUrl = url.startsWith("http") ? url : `${storeUrl()}${url}`
  const emailContent = (firstName: string) =>
    renderEmail(
      { subject: campaign.email_subject || campaign.title, heading: campaign.title, body: campaign.body, cta_label: "Shop now", cta_url: absoluteUrl },
      { store_url: storeUrl(), first_name: firstName }
    )

  // ---- test send: email only, to the admin who clicked "Send test"
  if (opts.testEmail) {
    await notifications.createNotifications({
      to: opts.testEmail,
      channel: "email",
      template: "campaign_test",
      content: { ...emailContent("there"), subject: `[TEST] ${campaign.email_subject || campaign.title}` },
    })
    return { test: true }
  }

  if (!master.enabled) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Admin broadcasts are disabled in Notification settings.")
  }
  if (!["draft", "scheduled", "failed"].includes(campaign.status)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Campaign is ${campaign.status}.`)
  }

  await messaging.updateCampaigns({ id: campaign.id, status: "sending", error: null })
  const stats = { recipients: 0, inbox: 0, webpush: 0, email: 0, failed: 0, skipped: 0 }

  try {
    const customerIds = await resolveAudience(container, campaign.audience)
    stats.recipients = customerIds.length

    for (let i = 0; i < customerIds.length; i += 200) {
      const batch = customerIds.slice(i, i + 200)
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name"],
        filters: { id: batch },
      })
      const prefs = await messaging.listNotificationPreferences({ customer_id: batch }, { take: batch.length })
      const prefBy = Object.fromEntries(prefs.map((p: any) => [p.customer_id, p]))

      if (channels.inbox) {
        const rows = customers
          .filter((c: any) => !prefBy[c.id]?.muted_types?.includes?.("campaign"))
          .map((c: any) => ({
            customer_id: c.id,
            type: "campaign",
            category: "marketing",
            title: campaign.title,
            body: campaign.body,
            url,
            image_url: campaign.image_url ?? null,
            campaign_id: campaign.id,
          }))
        if (rows.length) await messaging.createInboxMessages(rows as any)
        stats.inbox += rows.length
      }

      for (const c of customers as any[]) {
        const p = prefBy[c.id]
        if (p?.muted_types?.includes?.("campaign")) {
          stats.skipped++
          continue
        }
        if (channels.webpush && p?.marketing_push !== false) {
          stats.webpush += await sendPush(container, c.id, {
            type: "campaign",
            title: campaign.title,
            body: campaign.body,
            url,
            image_url: campaign.image_url ?? undefined,
            campaignId: campaign.id,
          })
        }
        if (channels.email && c.email && p?.marketing_email !== false) {
          try {
            await notifications.createNotifications({
              to: c.email,
              channel: "email",
              template: "campaign",
              content: emailContent(c.first_name || "there"),
              trigger_type: "campaign",
              receiver_id: c.id,
              resource_id: campaign.id,
            })
            stats.email++
          } catch (e: any) {
            stats.failed++
            logger.warn(`[campaign] email to ${c.email} failed: ${e.message}`)
          }
        }
      }
    }

    await messaging.updateCampaigns({ id: campaign.id, status: "sent", sent_at: new Date(), stats })
    return stats
  } catch (e: any) {
    await messaging.updateCampaigns({ id: campaign.id, status: "failed", error: String(e.message).slice(0, 500), stats })
    throw e
  }
}

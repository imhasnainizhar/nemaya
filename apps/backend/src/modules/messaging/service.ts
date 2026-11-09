import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import {
  Campaign,
  DeliveryLog,
  InboxMessage,
  KnownDevice,
  NotificationPreference,
  NotificationSetting,
  PushSubscription,
  SaleAnnouncement,
} from "./models/messaging-models"
import { CATALOG, CATALOG_BY_TYPE, CHANNELS, CatalogEntry, Channel, Templates } from "./catalog"

export type ResolvedSetting = CatalogEntry & {
  enabled: boolean
  overridden: boolean
  config: Record<string, number>
  stats?: { sent: number; failed: number }
}

class MessagingModuleService extends MedusaService({
  NotificationSetting,
  Campaign,
  InboxMessage,
  PushSubscription,
  KnownDevice,
  NotificationPreference,
  DeliveryLog,
  SaleAnnouncement,
}) {
  // ------------------------------------------------------------------ settings
  private merge(entry: CatalogEntry, row?: any): ResolvedSetting {
    const channels = { ...entry.channels, ...(row?.channels ?? {}) } as Record<Channel, boolean>
    // only channels the type supports
    for (const ch of CHANNELS) if (!entry.available_channels.includes(ch)) channels[ch] = false

    const templates: Templates = { ...entry.templates }
    for (const ch of CHANNELS) {
      const o = row?.templates?.[ch]
      if (o && templates[ch]) templates[ch] = { ...(templates[ch] as any), ...o }
    }

    let enabled = row ? !!row.enabled : true
    if (entry.locked) {
      // Locked security notifications can never be turned off and always email.
      enabled = true
      if (entry.available_channels.includes("email")) channels.email = true
    }
    return {
      ...entry,
      enabled,
      channels,
      templates,
      config: { ...(entry.config ?? {}), ...(row?.config ?? {}) },
      overridden: !!row,
    }
  }

  async getSetting(type: string): Promise<ResolvedSetting> {
    const entry = CATALOG_BY_TYPE[type]
    if (!entry) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Unknown notification type ${type}`)
    const [row] = await this.listNotificationSettings({ type }, { take: 1 })
    return this.merge(entry, row)
  }

  async listResolvedSettings(): Promise<ResolvedSetting[]> {
    const rows = await this.listNotificationSettings({}, { take: 500 })
    const byType = Object.fromEntries(rows.map((r: any) => [r.type, r]))
    return CATALOG.map((entry) => this.merge(entry, byType[entry.type]))
  }

  async updateSetting(
    type: string,
    input: { enabled?: boolean; channels?: Partial<Record<Channel, boolean>>; templates?: Templates; config?: Record<string, number> },
    actorId?: string
  ) {
    const entry = CATALOG_BY_TYPE[type]
    if (!entry) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Unknown notification type ${type}`)

    if (entry.locked) {
      if (input.enabled === false) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `"${entry.label}" is a locked security notification and can't be disabled.`)
      }
      if (input.channels && input.channels.email === false) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `"${entry.label}" must always be sent by email.`)
      }
    }
    for (const ch of Object.keys(input.channels ?? {}) as Channel[]) {
      if (!entry.available_channels.includes(ch) && input.channels![ch]) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `"${entry.label}" can't be sent via ${ch}.`)
      }
    }

    const [row] = await this.listNotificationSettings({ type }, { take: 1 })
    const data = {
      type,
      enabled: entry.locked ? true : input.enabled ?? (row as any)?.enabled ?? true,
      channels: { ...((row as any)?.channels ?? {}), ...(input.channels ?? {}) },
      templates: mergeTemplates((row as any)?.templates, input.templates),
      config: { ...((row as any)?.config ?? {}), ...(input.config ?? {}) },
      updated_by: actorId ?? null,
    }
    if (row) await this.updateNotificationSettings({ id: (row as any).id, ...data })
    else await this.createNotificationSettings(data)
    return this.getSetting(type)
  }

  async resetSetting(type: string) {
    const [row] = await this.listNotificationSettings({ type }, { take: 1 })
    if (row) await this.deleteNotificationSettings((row as any).id)
    return this.getSetting(type)
  }

  // --------------------------------------------------------------- preferences
  async getPreferences(customerId: string) {
    const [pref] = await this.listNotificationPreferences({ customer_id: customerId }, { take: 1 })
    return (
      (pref as any) ?? { customer_id: customerId, marketing_email: true, marketing_push: true, muted_types: [] }
    )
  }

  async setPreferences(customerId: string, input: { marketing_email?: boolean; marketing_push?: boolean; muted_types?: string[] }) {
    const muted = (input.muted_types ?? []).filter((t) => CATALOG_BY_TYPE[t]?.customer_optional)
    const [pref] = await this.listNotificationPreferences({ customer_id: customerId }, { take: 1 })
    const data = {
      ...(input.marketing_email !== undefined ? { marketing_email: input.marketing_email } : {}),
      ...(input.marketing_push !== undefined ? { marketing_push: input.marketing_push } : {}),
      ...(input.muted_types !== undefined ? { muted_types: muted as any } : {}),
    }
    if (pref) await this.updateNotificationPreferences({ id: (pref as any).id, ...data })
    else await this.createNotificationPreferences({ customer_id: customerId, ...data })
    return this.getPreferences(customerId)
  }

  // ------------------------------------------------------------------- devices
  /** Returns "first" (no devices yet), "known", or "new". Always records the device. */
  async recordDevice(customerId: string, fingerprint: string, label: string, ip?: string) {
    const devices = await this.listKnownDevices({ customer_id: customerId }, { take: 200 })
    const match = devices.find((d: any) => d.fingerprint === fingerprint)
    if (match) {
      await this.updateKnownDevices({ id: (match as any).id, last_seen_at: new Date(), last_ip: ip ?? null, label })
      return "known" as const
    }
    await this.createKnownDevices({ customer_id: customerId, fingerprint, label, last_ip: ip ?? null, last_seen_at: new Date() })
    return devices.length === 0 ? ("first" as const) : ("new" as const)
  }

  // ---------------------------------------------------------------- push subs
  async upsertPushSubscription(customerId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }, userAgent?: string) {
    const [existing] = await this.listPushSubscriptions({ endpoint: sub.endpoint }, { take: 1 })
    const data = {
      customer_id: customerId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent ?? null,
      failures: 0,
      last_seen_at: new Date(),
    }
    if (existing) return this.updatePushSubscriptions({ id: (existing as any).id, ...data })
    return this.createPushSubscriptions(data)
  }

  // -------------------------------------------------------------------- stats
  async deliveryStats(): Promise<Record<string, { sent: number; failed: number }>> {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000)
    const logs = await this.listDeliveryLogs({ created_at: { $gte: since } } as any, { take: 10000, select: ["type", "status"] })
    const stats: Record<string, { sent: number; failed: number }> = {}
    for (const l of logs as any[]) {
      stats[l.type] ??= { sent: 0, failed: 0 }
      if (l.status === "sent") stats[l.type].sent++
      if (l.status === "failed") stats[l.type].failed++
    }
    return stats
  }
}

function mergeTemplates(current?: Templates | null, patch?: Templates | null): Templates {
  const out: any = { ...(current ?? {}) }
  for (const [ch, tpl] of Object.entries(patch ?? {})) out[ch] = { ...(out[ch] ?? {}), ...(tpl as any) }
  return out
}

export default MessagingModuleService

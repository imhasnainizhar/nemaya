import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BellAlert, LockClosedSolid } from "@medusajs/icons"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useState } from "react"
import { Link } from "react-router-dom"
import { api, useApi } from "../../lib/api"

type Channel = "email" | "webpush" | "inbox"
type Setting = {
  type: string
  category: string
  label: string
  description: string
  trigger: string
  locked?: boolean
  customer_optional?: boolean
  enabled: boolean
  channels: Record<Channel, boolean>
  available_channels: Channel[]
  templates: Record<string, Record<string, string>>
  variables: string[]
  config: Record<string, number>
  overridden: boolean
  stats: { sent: number; failed: number }
}

const CATEGORY_LABEL: Record<string, string> = {
  security: "Security (locked)",
  account: "Account",
  order: "Orders",
  gift_card: "Gift cards",
  marketing: "Marketing",
  admin: "Admin alerts",
}
const CHANNEL_LABEL: Record<Channel, string> = { email: "Email", webpush: "Web push", inbox: "In-app inbox" }

const NotificationsPage = () => {
  const { data, loading, reload, setData } = useApi<{ settings: Setting[]; push_configured: boolean }>(
    "/admin/nemaya/notification-settings"
  )
  const [editing, setEditing] = useState<Setting | null>(null)

  const save = async (type: string, body: Partial<Setting> & Record<string, unknown>) => {
    try {
      const { setting } = await api<{ setting: Setting }>(`/admin/nemaya/notification-settings/${type}`, { method: "POST", body })
      setData((d) => (d ? { ...d, settings: d.settings.map((s) => (s.type === type ? { ...s, ...setting } : s)) } : d))
      toast.success("Saved")
      return setting
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const grouped = (data?.settings ?? []).reduce<Record<string, Setting[]>>((acc, s) => {
    ;(acc[s.category] ??= []).push(s)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-y-3">
      <Toaster />
      <Container className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Notifications</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Switch every notification type on or off, choose its channels and edit its message. Security notifications are locked on.
          </Text>
        </div>
        <div className="flex gap-2">
          <Link to="/notifications/campaigns">
            <Button variant="secondary" size="small">Campaigns</Button>
          </Link>
        </div>
      </Container>

      {data && !data.push_configured && (
        <Container className="px-6 py-3">
          <Text size="small" className="text-ui-fg-subtle">
            ⚠️ Web push is not configured (VAPID keys missing). Push toggles are saved but nothing will be delivered until keys are set.
          </Text>
        </Container>
      )}

      {loading && !data && <Container className="px-6 py-4"><Text>Loading…</Text></Container>}

      {Object.entries(grouped).map(([category, items]) => (
        <Container key={category} className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">{CATEGORY_LABEL[category] ?? category}</Heading>
          </div>
          {items.map((s) => (
            <div key={s.type} className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Text weight="plus">{s.label}</Text>
                  {s.locked && (
                    <Badge size="2xsmall" color="orange">
                      <LockClosedSolid className="mr-1" /> Locked
                    </Badge>
                  )}
                  {s.customer_optional && <Badge size="2xsmall">Customer can opt out</Badge>}
                  {s.overridden && <Badge size="2xsmall" color="blue">Customized</Badge>}
                </div>
                <Text size="small" className="text-ui-fg-subtle">{s.description}</Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Trigger: <code>{s.trigger}</code> · Last 30 days: {s.stats.sent} sent, {s.stats.failed} failed
                </Text>
                <div className="mt-2 flex flex-wrap gap-4">
                  {s.available_channels.map((ch) => (
                    <div key={ch} className="flex items-center gap-2">
                      <Checkbox
                        id={`${s.type}-${ch}`}
                        checked={!!s.channels[ch]}
                        disabled={(s.locked && ch === "email") || !s.enabled}
                        onCheckedChange={(v) => save(s.type, { channels: { [ch]: !!v } as any })}
                      />
                      <Label htmlFor={`${s.type}-${ch}`} size="small">{CHANNEL_LABEL[ch]}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Button size="small" variant="secondary" onClick={() => setEditing(s)}>
                  Edit message
                </Button>
                <Switch
                  checked={s.enabled}
                  disabled={s.locked}
                  onCheckedChange={(v) => save(s.type, { enabled: v })}
                  aria-label={`Enable ${s.label}`}
                />
              </div>
            </div>
          ))}
        </Container>
      ))}

      {editing && (
        <TemplateDrawer
          setting={editing}
          onClose={() => setEditing(null)}
          onSave={async (body) => {
            const updated = await save(editing.type, body)
            if (updated) setEditing(null)
          }}
          onReset={async () => {
            await api(`/admin/nemaya/notification-settings/${editing.type}`, { method: "DELETE" })
            toast.success("Reset to default")
            setEditing(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

const FIELDS: Record<Channel, string[]> = {
  email: ["subject", "heading", "body", "cta_label", "cta_url"],
  webpush: ["title", "body", "url"],
  inbox: ["title", "body", "url"],
}

function TemplateDrawer({
  setting,
  onClose,
  onSave,
  onReset,
}: {
  setting: Setting
  onClose: () => void
  onSave: (body: any) => Promise<void>
  onReset: () => Promise<void>
}) {
  const [templates, setTemplates] = useState<Record<string, Record<string, string>>>(() => JSON.parse(JSON.stringify(setting.templates ?? {})))
  const [config, setConfig] = useState<Record<string, number>>({ ...(setting.config ?? {}) })
  const channels = setting.available_channels.filter((c) => templates[c])

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{setting.label}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-6 overflow-y-auto">
          {setting.variables.length > 0 && (
            <Text size="small" className="text-ui-fg-subtle">
              Variables: {setting.variables.map((v) => <code key={v} className="mr-2">{`{{${v}}}`}</code>)}
            </Text>
          )}
          {channels.map((ch) => (
            <div key={ch} className="flex flex-col gap-3">
              <Heading level="h3">{CHANNEL_LABEL[ch]}</Heading>
              {FIELDS[ch].filter((f) => templates[ch]?.[f] !== undefined || f !== "cta_label").map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <Label size="small">{field.replace("_", " ")}</Label>
                  {field === "body" ? (
                    <Textarea
                      rows={4}
                      value={templates[ch]?.[field] ?? ""}
                      onChange={(e) => setTemplates((t) => ({ ...t, [ch]: { ...t[ch], [field]: e.target.value } }))}
                    />
                  ) : (
                    <Input
                      value={templates[ch]?.[field] ?? ""}
                      onChange={(e) => setTemplates((t) => ({ ...t, [ch]: { ...t[ch], [field]: e.target.value } }))}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
          {Object.keys(config).length > 0 && (
            <div className="flex flex-col gap-3">
              <Heading level="h3">Rules</Heading>
              {Object.entries(config).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <Label size="small">{k.replace(/_/g, " ")}</Label>
                  <Input type="number" value={v} onChange={(e) => setConfig((c) => ({ ...c, [k]: Number(e.target.value) }))} />
                </div>
              ))}
            </div>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={onReset}>Reset to default</Button>
          <Button onClick={() => onSave({ templates, config })}>Save</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export const config = defineRouteConfig({
  label: "Notifications",
  icon: BellAlert,
})

export default NotificationsPage

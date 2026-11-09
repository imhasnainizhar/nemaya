import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  StatusBadge,
  Table,
  Text,
  Textarea,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useState } from "react"
import { Link } from "react-router-dom"
import { api, fmtDate, useApi } from "../../../lib/api"

type Campaign = {
  id: string
  name: string
  title: string
  body: string
  image_url?: string | null
  url?: string | null
  email_subject?: string | null
  channels: { email: boolean; webpush: boolean; inbox: boolean }
  audience: { type: "all" | "customer_group" | "wishlist_product"; value?: string | null }
  status: "draft" | "scheduled" | "sending" | "sent" | "canceled" | "failed"
  scheduled_at?: string | null
  sent_at?: string | null
  stats?: Record<string, number> | null
  error?: string | null
}

const STATUS_COLOR: Record<Campaign["status"], "grey" | "blue" | "orange" | "green" | "red"> = {
  draft: "grey",
  scheduled: "blue",
  sending: "orange",
  sent: "green",
  canceled: "grey",
  failed: "red",
}

const empty: Partial<Campaign> = {
  name: "",
  title: "",
  body: "",
  url: "/shop",
  channels: { email: false, webpush: true, inbox: true },
  audience: { type: "all" },
}

const CampaignsPage = () => {
  const { data, reload } = useApi<{ campaigns: Campaign[] }>("/admin/nemaya/campaigns")
  const [form, setForm] = useState<Partial<Campaign> | null>(null)

  const act = async (fn: () => Promise<any>, ok: string) => {
    try {
      await fn()
      toast.success(ok)
      reload()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Toaster />
      <Container className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Campaigns</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Broadcast sale announcements and drops via web push, the in-app inbox and email. Customers who opted out are skipped automatically.
          </Text>
        </div>
        <div className="flex gap-2">
          <Link to="/notifications"><Button size="small" variant="secondary">Settings</Button></Link>
          <Button size="small" onClick={() => setForm({ ...empty })}>New campaign</Button>
        </div>
      </Container>

      <Container className="p-0">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Channels</Table.HeaderCell>
              <Table.HeaderCell>Audience</Table.HeaderCell>
              <Table.HeaderCell>When</Table.HeaderCell>
              <Table.HeaderCell>Results</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(data?.campaigns ?? []).map((c) => (
              <Table.Row key={c.id}>
                <Table.Cell>
                  <div className="flex flex-col">
                    <Text size="small" weight="plus">{c.name}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">{c.title}</Text>
                  </div>
                </Table.Cell>
                <Table.Cell><StatusBadge color={STATUS_COLOR[c.status]}>{c.status}</StatusBadge></Table.Cell>
                <Table.Cell>
                  <div className="flex gap-1">
                    {Object.entries(c.channels).filter(([, v]) => v).map(([k]) => <Badge key={k} size="2xsmall">{k}</Badge>)}
                  </div>
                </Table.Cell>
                <Table.Cell><Text size="small">{c.audience.type.replace("_", " ")}</Text></Table.Cell>
                <Table.Cell><Text size="small">{c.sent_at ? `Sent ${fmtDate(c.sent_at)}` : c.scheduled_at ? fmtDate(c.scheduled_at) : "—"}</Text></Table.Cell>
                <Table.Cell>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {c.stats ? `${c.stats.recipients ?? 0} people · ${c.stats.inbox ?? 0} inbox · ${c.stats.webpush ?? 0} push · ${c.stats.email ?? 0} email` : c.error ?? "—"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex justify-end gap-2">
                    <Button size="small" variant="transparent" onClick={() => act(() => api(`/admin/nemaya/campaigns/${c.id}/test`, { method: "POST" }), "Test email sent to you")}>
                      Test
                    </Button>
                    {["draft", "scheduled", "failed"].includes(c.status) && (
                      <>
                        <Button size="small" variant="secondary" onClick={() => setForm(c)}>Edit</Button>
                        <Button
                          size="small"
                          onClick={() => {
                            if (confirm(`Send "${c.name}" now to ${c.audience.type === "all" ? "all customers" : "this audience"}?`)) {
                              act(() => api(`/admin/nemaya/campaigns/${c.id}/send`, { method: "POST" }), "Sending…")
                            }
                          }}
                        >
                          Send now
                        </Button>
                      </>
                    )}
                    {c.status !== "sending" && c.status !== "sent" && (
                      <Button size="small" variant="danger" onClick={() => act(() => api(`/admin/nemaya/campaigns/${c.id}`, { method: "DELETE" }), c.status === "scheduled" ? "Canceled" : "Deleted")}>
                        {c.status === "scheduled" ? "Cancel" : "Delete"}
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
            {!data?.campaigns?.length && (
              <Table.Row>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">No campaigns yet.</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Container>

      {form && (
        <CampaignDrawer
          initial={form}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function toLocalInput(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function CampaignDrawer({ initial, onClose, onSaved }: { initial: Partial<Campaign>; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState<Partial<Campaign>>(initial)
  const [schedule, setSchedule] = useState(toLocalInput(initial.scheduled_at))
  const groups = useApi<{ customer_groups: { id: string; name: string }[] }>("/admin/customer-groups?limit=100&fields=id,name")
  const products = useApi<{ products: { id: string; title: string }[] }>("/admin/products?limit=100&fields=id,title")
  const set = (patch: Partial<Campaign>) => setC((x) => ({ ...x, ...patch }))

  const submit = async () => {
    const body = {
      name: c.name,
      title: c.title,
      body: c.body,
      url: c.url,
      image_url: c.image_url,
      email_subject: c.email_subject,
      channels: c.channels,
      audience: c.audience,
      scheduled_at: schedule ? new Date(schedule).toISOString() : null,
    }
    try {
      if (c.id) await api(`/admin/nemaya/campaigns/${c.id}`, { method: "POST", body })
      else await api(`/admin/nemaya/campaigns`, { method: "POST", body })
      toast.success(schedule ? "Campaign scheduled" : "Draft saved")
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{c.id ? "Edit campaign" : "New campaign"}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4 overflow-y-auto">
          <Field label="Internal name"><Input value={c.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="Winter sale launch" /></Field>
          <Field label="Title (push / inbox / email heading)"><Input value={c.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder="Winter sale is live 🌿" /></Field>
          <Field label="Message"><Textarea rows={4} value={c.body ?? ""} onChange={(e) => set({ body: e.target.value })} placeholder="Up to 40% off outerwear. This weekend only." /></Field>
          <Field label="Email subject (optional)"><Input value={c.email_subject ?? ""} onChange={(e) => set({ email_subject: e.target.value })} /></Field>
          <Field label="Link (storefront path or URL)"><Input value={c.url ?? ""} onChange={(e) => set({ url: e.target.value })} placeholder="/shop?sale=1" /></Field>
          <Field label="Image URL (optional)"><Input value={c.image_url ?? ""} onChange={(e) => set({ image_url: e.target.value })} /></Field>

          <div className="flex flex-col gap-2">
            <Label size="small">Channels</Label>
            <div className="flex gap-4">
              {(["webpush", "inbox", "email"] as const).map((ch) => (
                <div key={ch} className="flex items-center gap-2">
                  <Checkbox id={`ch-${ch}`} checked={!!c.channels?.[ch]} onCheckedChange={(v) => set({ channels: { ...c.channels!, [ch]: !!v } })} />
                  <Label htmlFor={`ch-${ch}`} size="small">{ch === "webpush" ? "Web push" : ch === "inbox" ? "In-app inbox" : "Email"}</Label>
                </div>
              ))}
            </div>
          </div>

          <Field label="Audience">
            <Select value={c.audience?.type ?? "all"} onValueChange={(v) => set({ audience: { type: v as any, value: null } })}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All customers</Select.Item>
                <Select.Item value="customer_group">A customer group</Select.Item>
                <Select.Item value="wishlist_product">People who wishlisted a product</Select.Item>
              </Select.Content>
            </Select>
          </Field>
          {c.audience?.type === "customer_group" && (
            <Field label="Customer group">
              <Select value={c.audience.value ?? ""} onValueChange={(v) => set({ audience: { type: "customer_group", value: v } })}>
                <Select.Trigger><Select.Value placeholder="Choose a group" /></Select.Trigger>
                <Select.Content>
                  {(groups.data?.customer_groups ?? []).map((g) => <Select.Item key={g.id} value={g.id}>{g.name}</Select.Item>)}
                </Select.Content>
              </Select>
            </Field>
          )}
          {c.audience?.type === "wishlist_product" && (
            <Field label="Product">
              <Select value={c.audience.value ?? ""} onValueChange={(v) => set({ audience: { type: "wishlist_product", value: v } })}>
                <Select.Trigger><Select.Value placeholder="Choose a product" /></Select.Trigger>
                <Select.Content>
                  {(products.data?.products ?? []).map((p) => <Select.Item key={p.id} value={p.id}>{p.title}</Select.Item>)}
                </Select.Content>
              </Select>
            </Field>
          )}
          <Field label="Schedule (leave empty to save as draft)">
            <Input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
          </Field>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={submit}>{schedule ? "Schedule" : "Save draft"}</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label size="small">{label}</Label>
      {children}
    </div>
  )
}

export const config = defineRouteConfig({ label: "Campaigns" })

export default CampaignsPage

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Gift } from "@medusajs/icons"
import {
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  StatusBadge,
  Table,
  Text,
  Textarea,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useState } from "react"
import { api, fmtDate, money, useApi } from "../../lib/api"

type GiftCard = {
  id: string
  code: string
  balance: number
  initial_amount: number
  currency_code: string
  status: "active" | "disabled"
  source: "purchase" | "admin"
  recipient_email?: string | null
  recipient_name?: string | null
  purchaser_email?: string | null
  expires_at?: string | null
  deliver_at?: string | null
  delivered_at?: string | null
  order_id?: string | null
  note?: string | null
  created_at: string
}

const GiftCardsPage = () => {
  const [q, setQ] = useState("")
  const [offset, setOffset] = useState(0)
  const { data, reload } = useApi<{ gift_cards: GiftCard[]; count: number }>(
    `/admin/nemaya/gift-cards?limit=20&offset=${offset}&q=${encodeURIComponent(q)}`
  )
  const [issuing, setIssuing] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-y-3">
      <Toaster />
      <Container className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Gift cards</Heading>
          <Text size="small" className="text-ui-fg-subtle">Every card sold or issued, with a full balance ledger.</Text>
        </div>
        <div className="flex gap-2">
          <Input size="small" placeholder="Search code or email" value={q} onChange={(e) => { setOffset(0); setQ(e.target.value) }} />
          <Button size="small" onClick={() => setIssuing(true)}>Issue gift card</Button>
        </div>
      </Container>

      <Container className="p-0">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Code</Table.HeaderCell>
              <Table.HeaderCell>Balance</Table.HeaderCell>
              <Table.HeaderCell>Recipient</Table.HeaderCell>
              <Table.HeaderCell>Source</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(data?.gift_cards ?? []).map((g) => (
              <Table.Row key={g.id} className="cursor-pointer" onClick={() => setSelected(g.id)}>
                <Table.Cell><code>{g.code}</code></Table.Cell>
                <Table.Cell>{money(g.balance, g.currency_code)} <span className="text-ui-fg-muted">/ {money(g.initial_amount, g.currency_code)}</span></Table.Cell>
                <Table.Cell>{g.recipient_email ?? "—"}</Table.Cell>
                <Table.Cell>{g.source}</Table.Cell>
                <Table.Cell><StatusBadge color={g.status === "active" ? "green" : "grey"}>{g.status}</StatusBadge></Table.Cell>
                <Table.Cell>{fmtDate(g.created_at)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <Table.Pagination
          count={data?.count ?? 0}
          pageSize={20}
          pageIndex={offset / 20}
          pageCount={Math.max(1, Math.ceil((data?.count ?? 0) / 20))}
          canPreviousPage={offset > 0}
          canNextPage={offset + 20 < (data?.count ?? 0)}
          previousPage={() => setOffset((o) => Math.max(0, o - 20))}
          nextPage={() => setOffset((o) => o + 20)}
        />
      </Container>

      {issuing && <IssueDrawer onClose={() => setIssuing(false)} onDone={() => { setIssuing(false); reload() }} />}
      {selected && <DetailDrawer id={selected} onClose={() => { setSelected(null); reload() }} />}
    </div>
  )
}

function IssueDrawer({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ amount: "50", recipient_email: "", recipient_name: "", message: "", note: "", expires_at: "" })
  const submit = async () => {
    try {
      await api("/admin/nemaya/gift-cards", { method: "POST", body: { ...f, amount: Number(f.amount), expires_at: f.expires_at || null } })
      toast.success(f.recipient_email ? "Gift card issued and emailed" : "Gift card issued")
      onDone()
    } catch (e: any) {
      toast.error(e.message)
    }
  }
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header><Drawer.Title>Issue gift card</Drawer.Title></Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4">
          {(
            [
              ["amount", "Amount (USD)", "number"],
              ["recipient_email", "Recipient email (optional — emails the code)", "email"],
              ["recipient_name", "Recipient name", "text"],
              ["expires_at", "Expires (optional)", "date"],
              ["note", "Internal note (e.g. compensation for order #1042)", "text"],
            ] as const
          ).map(([k, label, type]) => (
            <div key={k} className="flex flex-col gap-1">
              <Label size="small">{label}</Label>
              <Input type={type} value={(f as any)[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <Label size="small">Message to recipient</Label>
            <Textarea value={f.message} onChange={(e) => setF((x) => ({ ...x, message: e.target.value }))} />
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Issue</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

function DetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, reload } = useApi<{ gift_card: GiftCard; transactions: any[] }>(`/admin/nemaya/gift-cards/${id}`)
  const [delta, setDelta] = useState("")
  const [reason, setReason] = useState("")
  const g = data?.gift_card

  const act = async (body: any, ok: string) => {
    try {
      await api(`/admin/nemaya/gift-cards/${id}`, { method: "POST", body })
      toast.success(ok)
      setDelta("")
      setReason("")
      reload()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header><Drawer.Title>{g?.code ?? "Gift card"}</Drawer.Title></Drawer.Header>
        <Drawer.Body className="flex flex-col gap-5 overflow-y-auto">
          {g && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Info label="Balance" value={`${money(g.balance, g.currency_code)} of ${money(g.initial_amount, g.currency_code)}`} />
                <Info label="Status" value={g.status} />
                <Info label="Recipient" value={g.recipient_name ? `${g.recipient_name} <${g.recipient_email}>` : g.recipient_email ?? "—"} />
                <Info label="Purchaser" value={g.purchaser_email ?? (g.source === "admin" ? "Issued by admin" : "—")} />
                <Info label="Delivery" value={g.delivered_at ? `Delivered ${fmtDate(g.delivered_at)}` : g.deliver_at ? `Scheduled ${fmtDate(g.deliver_at)}` : "Not emailed"} />
                <Info label="Expires" value={g.expires_at ? fmtDate(g.expires_at) : "Never"} />
              </div>

              <div className="flex flex-col gap-2 rounded-lg border p-4">
                <Heading level="h3">Adjust balance</Heading>
                <Input placeholder="Amount (+25 or -10)" value={delta} onChange={(e) => setDelta(e.target.value)} />
                <Input placeholder="Reason (required, logged)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button size="small" onClick={() => act({ action: "adjust", amount: Number(delta), reason }, "Balance adjusted")}>Apply adjustment</Button>
              </div>

              <div className="flex gap-2">
                {g.status === "active" ? (
                  <Button variant="danger" size="small" onClick={() => act({ action: "disable", reason: "Disabled by admin" }, "Disabled")}>Disable card</Button>
                ) : (
                  <Button variant="secondary" size="small" onClick={() => act({ action: "enable" }, "Enabled")}>Re-enable card</Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Heading level="h3">Ledger</Heading>
                {(data?.transactions ?? []).map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b py-2">
                    <div>
                      <Text size="small" weight="plus">{t.type}</Text>
                      <Text size="xsmall" className="text-ui-fg-subtle">{t.reason ?? t.order_id ?? ""} · {fmtDate(t.created_at)}</Text>
                    </div>
                    <Text size="small">{t.amount > 0 ? "+" : ""}{money(t.amount, g.currency_code)} → {money(t.balance_after, g.currency_code)}</Text>
                  </div>
                ))}
              </div>
            </>
          )}
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <Text size="xsmall" className="text-ui-fg-subtle">{label}</Text>
    <Text size="small">{value}</Text>
  </div>
)

export const config = defineRouteConfig({ label: "Gift cards", icon: Gift })

export default GiftCardsPage

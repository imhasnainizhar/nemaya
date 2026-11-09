import { bad, str } from "../../../utils"

export function parseCampaignBody(b: any, partial = false) {
  const out: Record<string, unknown> = {}
  const name = str(b.name, 120)
  const title = str(b.title, 120)
  const body = str(b.body, 1000)
  if (!partial || name !== undefined) {
    if (!name) throw bad("Campaign name is required.")
    out.name = name
  }
  if (!partial || title !== undefined) {
    if (!title) throw bad("Title is required.")
    out.title = title
  }
  if (!partial || body !== undefined) {
    if (!body) throw bad("Message is required.")
    out.body = body
  }
  for (const k of ["image_url", "url", "email_subject"]) {
    if (b[k] !== undefined) out[k] = str(b[k], 500) || null
  }
  if (b.channels !== undefined || !partial) {
    const c = b.channels ?? {}
    const channels = { email: !!c.email, webpush: !!c.webpush, inbox: !!c.inbox }
    if (!channels.email && !channels.webpush && !channels.inbox) throw bad("Pick at least one channel.")
    out.channels = channels
  }
  if (b.audience !== undefined || !partial) {
    const a = b.audience ?? { type: "all" }
    if (!["all", "customer_group", "wishlist_product"].includes(a.type)) throw bad("Unknown audience.")
    if (a.type !== "all" && !a.value) throw bad("Pick a customer group or product for this audience.")
    out.audience = { type: a.type, value: a.type === "all" ? null : String(a.value) }
  }
  if (b.scheduled_at !== undefined) {
    if (b.scheduled_at === null || b.scheduled_at === "") {
      out.scheduled_at = null
      out.status = "draft"
    } else {
      const d = new Date(b.scheduled_at)
      if (Number.isNaN(d.getTime())) throw bad("Invalid schedule date.")
      out.scheduled_at = d
      out.status = "scheduled"
    }
  }
  return out
}

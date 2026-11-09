import { NextResponse } from "next/server"
import { getInbox } from "@/lib/data"
import { medusa } from "@/lib/medusa"

export const dynamic = "force-dynamic"

/** Polled by the header bell. */
export async function GET() {
  const inbox = await getInbox(6, 0)
  return NextResponse.json(inbox)
}

/** { ids?: string[] } — marks as read (all when ids omitted). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  await medusa("/store/me/notifications/read", { method: "POST", body: body?.ids ? { ids: body.ids } : { all: true } }).catch(() => undefined)
  return NextResponse.json({ ok: true })
}

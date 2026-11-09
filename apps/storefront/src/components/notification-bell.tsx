"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import type { InboxMessage } from "@/lib/types"
import { cn, timeAgo } from "@/lib/util"

type Inbox = { messages: InboxMessage[]; unread_count: number }

export function NotificationBell() {
  const [inbox, setInbox] = useState<Inbox>({ messages: [], unread_count: 0 })
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = () =>
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInbox(d))
      .catch(() => undefined)

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000)
    const onPush = () => load()
    navigator.serviceWorker?.addEventListener?.("message", onPush)
    return () => {
      clearInterval(t)
      navigator.serviceWorker?.removeEventListener?.("message", onPush)
    }
  }, [])

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const markAll = async () => {
    await fetch("/api/notifications", { method: "POST", body: "{}" })
    setInbox((i) => ({ messages: i.messages.map((m) => ({ ...m, read_at: m.read_at ?? new Date().toISOString() })), unread_count: 0 }))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={`Notifications${inbox.unread_count ? `, ${inbox.unread_count} unread` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-full bg-sand/70 transition-colors hover:bg-sand"
      >
        <Bell className="h-[19px] w-[19px]" strokeWidth={1.7} />
        {inbox.unread_count > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-clay ring-2 ring-linen" />}
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-[min(360px,calc(100vw-32px))] overflow-hidden shadow-xl shadow-bark/10 animate-rise">
          <div className="flex items-center justify-between border-b border-bark/10 px-5 py-4">
            <p className="font-display text-lg">Notifications</p>
            {inbox.unread_count > 0 && (
              <button onClick={markAll} className="text-xs font-semibold text-clay hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[380px] divide-y divide-bark/5 overflow-y-auto">
            {inbox.messages.length === 0 && <li className="px-5 py-8 text-center text-sm text-stone">You're all caught up 🌿</li>}
            {inbox.messages.map((m) => (
              <li key={m.id}>
                <Link
                  href={m.url || "/account/notifications"}
                  onClick={() => setOpen(false)}
                  className={cn("flex gap-3 px-5 py-4 transition hover:bg-sand/50", !m.read_at && "bg-sand/30")}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", m.read_at ? "bg-transparent" : "bg-clay")} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{m.title}</span>
                    <span className="line-clamp-2 block text-xs text-bark-soft">{m.body}</span>
                    <span className="mt-1 block text-[11px] text-stone">{timeAgo(m.created_at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/account/notifications" onClick={() => setOpen(false)} className="block border-t border-bark/10 px-5 py-3 text-center text-sm font-semibold hover:bg-sand/50">
            View all
          </Link>
        </div>
      )}
    </div>
  )
}

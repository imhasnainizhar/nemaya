"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Bell, Gift, Package, Shield, Sparkles } from "lucide-react"
import { markNotificationsReadAction } from "@/lib/actions"
import type { InboxMessage } from "@/lib/types"
import { cn, timeAgo } from "@/lib/util"

const ICON: Record<string, any> = { security: Shield, order: Package, gift_card: Gift, marketing: Sparkles }

export function Inbox({ initial, unread }: { initial: InboxMessage[]; unread: number }) {
  const [messages, setMessages] = useState(initial)
  const [count, setCount] = useState(unread)
  const [pending, start] = useTransition()

  const markAll = () =>
    start(async () => {
      await markNotificationsReadAction()
      setMessages((m) => m.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
      setCount(0)
    })

  const open = (m: InboxMessage) => {
    if (!m.read_at) {
      markNotificationsReadAction([m.id])
      setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, read_at: new Date().toISOString() } : x)))
      setCount((c) => Math.max(0, c - 1))
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between p-6 sm:px-8">
        <h2 className="font-display text-3xl">Inbox {count > 0 && <span className="ml-1 align-middle text-base text-clay">· {count} new</span>}</h2>
        {count > 0 && (
          <button onClick={markAll} disabled={pending} className="text-sm font-semibold text-clay hover:underline">Mark all read</button>
        )}
      </div>
      <ul className="divide-y divide-bark/5 border-t border-bark/10">
        {messages.length === 0 && <li className="px-8 py-12 text-center text-sm text-stone">No notifications yet.</li>}
        {messages.map((m) => {
          const Icon = ICON[m.category] ?? Bell
          return (
            <li key={m.id}>
              <Link href={m.url || "#"} onClick={() => open(m)} className={cn("flex gap-4 px-6 py-5 transition hover:bg-sand/40 sm:px-8", !m.read_at && "bg-sand/30")}>
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", m.category === "security" ? "bg-clay/15 text-clay" : "bg-sand text-bark")}>
                  <Icon className="h-4 w-4" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{m.title}</span>
                    {!m.read_at && <span className="h-2 w-2 rounded-full bg-clay" />}
                  </span>
                  <span className="mt-0.5 block text-sm text-bark-soft">{m.body}</span>
                  <span className="mt-1 block text-xs text-stone">{timeAgo(m.created_at)}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

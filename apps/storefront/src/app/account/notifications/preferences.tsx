"use client"

import { useState, useTransition } from "react"
import { Lock } from "lucide-react"
import { savePreferencesAction } from "@/lib/actions"
import { cn } from "@/lib/util"

type Prefs = { marketing_email: boolean; marketing_push: boolean; muted_types: string[] }

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-moss" : "bg-sand-deep")}
    >
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-paper shadow transition-all", checked ? "left-6" : "left-1")} />
    </button>
  )
}

export function Preferences({ initial, optional }: { initial: Prefs; optional: { type: string; label: string; description: string }[] }) {
  const [prefs, setPrefs] = useState<Prefs>({ ...initial, muted_types: initial.muted_types ?? [] })
  const [, start] = useTransition()
  const save = (next: Prefs) => {
    setPrefs(next)
    start(() => savePreferencesAction(next))
  }

  return (
    <section className="card p-6 sm:p-8">
      <h2 className="font-display text-3xl">Preferences</h2>
      <p className="mt-1 text-sm text-stone">Choose which marketing messages you get. Changes save automatically.</p>

      <div className="mt-6 divide-y divide-bark/10">
        <Row title="Marketing emails" desc="Sales, drops and wishlist alerts by email.">
          <Switch label="Marketing emails" checked={prefs.marketing_email} onChange={(v) => save({ ...prefs, marketing_email: v })} />
        </Row>
        <Row title="Marketing push" desc="Sales, drops and wishlist alerts as push notifications.">
          <Switch label="Marketing push" checked={prefs.marketing_push} onChange={(v) => save({ ...prefs, marketing_push: v })} />
        </Row>
        {optional.map((t) => {
          const on = !prefs.muted_types.includes(t.type)
          return (
            <Row key={t.type} title={t.label} desc={t.description}>
              <Switch
                label={t.label}
                checked={on}
                onChange={(v) => save({ ...prefs, muted_types: v ? prefs.muted_types.filter((x) => x !== t.type) : [...prefs.muted_types, t.type] })}
              />
            </Row>
          )
        })}
        <Row title="Orders & security" desc="Order updates, password and sign-in alerts. These keep your account safe and can't be turned off.">
          <Lock className="h-5 w-5 text-stone" />
        </Row>
      </div>
    </section>
  )
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-stone">{desc}</p>
      </div>
      {children}
    </div>
  )
}

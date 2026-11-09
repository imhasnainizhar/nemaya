"use client"

import { useEffect, useState } from "react"
import { BellOff, BellRing, Loader2 } from "lucide-react"
import { removePushSubscriptionAction, savePushSubscriptionAction } from "@/lib/actions"
import { cn } from "@/lib/util"

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

type State = "unsupported" | "denied" | "off" | "on" | "loading"

export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID) return setState("unsupported")
      if (Notification.permission === "denied") return setState("denied")
      const reg = await navigator.serviceWorker.register("/sw.js")
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? "on" : "off")
    })().catch(() => setState("unsupported"))
  }, [])

  const enable = async () => {
    setError(null)
    setState("loading")
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off")
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID) }))
      await savePushSubscriptionAction(sub.toJSON())
      setState("on")
    } catch (e: any) {
      setError(e?.message ?? "Couldn't turn on notifications.")
      setState("off")
    }
  }

  const disable = async () => {
    setState("loading")
    const reg = await navigator.serviceWorker.getRegistration("/sw.js")
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await removePushSubscriptionAction(sub.endpoint)
      await sub.unsubscribe()
    }
    setState("off")
  }

  if (state === "unsupported")
    return <p className="text-sm text-stone">{compact ? "" : "This browser doesn't support web push notifications."}</p>
  if (state === "denied")
    return <p className="text-sm text-clay">Notifications are blocked for this site. Allow them in your browser's site settings.</p>

  return (
    <div>
      <button
        onClick={state === "on" ? disable : enable}
        disabled={state === "loading"}
        className={cn(state === "on" ? "btn-ghost" : compact ? "btn bg-linen text-bark hover:bg-paper" : "btn-clay")}
      >
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "on" ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
        {state === "on" ? "Turn off on this device" : "Turn on notifications"}
      </button>
      {error && <p className="mt-2 text-xs text-clay">{error}</p>}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Leaf, X } from "lucide-react"

const KEY = "nemaya:newsletter-dismissed"

/**
 * One-time "join the list" popover (bottom corner, non-blocking).
 * Sends people to sign-up with their email prefilled — accounts are how
 * Nemaya delivers drop alerts and marketing preferences.
 */
export function NewsletterPopover({ signedIn, raised = false }: { signedIn: boolean; raised?: boolean }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (signedIn) return
    let dismissed = false
    try {
      dismissed = !!localStorage.getItem(KEY)
    } catch {}
    if (dismissed) return
    const t = setTimeout(() => setOpen(true), 9000)
    return () => clearTimeout(t)
  }, [signedIn])

  const dismiss = () => {
    setOpen(false)
    try {
      localStorage.setItem(KEY, String(Date.now()))
    } catch {}
  }

  if (!open) return null
  return (
    <div role="dialog" aria-label="Join the Nemaya list" className={`fixed right-4 left-4 z-50 sm:left-auto sm:w-[360px] animate-rise ${raised ? "bottom-28 lg:bottom-4" : "bottom-4"}`}>
      <button onClick={dismiss} aria-label="Close" className="absolute -top-3 -right-1 z-10 grid h-9 w-9 place-items-center rounded-full bg-bark text-linen shadow-lg">
        <X className="h-4 w-4" />
      </button>
      <div className="grain relative overflow-hidden rounded-[28px] bg-bark p-6 text-linen shadow-2xl shadow-bark/30">
        <span className="blob absolute -top-16 -right-14 h-44 w-44 bg-clay/50" />
        <Leaf className="relative h-6 w-6 text-sage" strokeWidth={1.5} />
        <p className="font-display relative mt-4 text-3xl leading-tight">First to know.</p>
        <p className="relative mt-2 text-sm text-linen/75">Early access to drops, restock alerts on your wishlist and members-only offers.</p>
        <form
          className="relative mt-5 space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            dismiss()
            router.push(`/register?email=${encodeURIComponent(email)}`)
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            aria-label="Email"
            className="w-full rounded-full border border-linen/20 bg-linen/10 px-5 py-3 text-sm text-linen placeholder:text-linen/50 focus:border-linen/60 focus:outline-none"
          />
          <button className="btn w-full bg-clay py-3 text-linen hover:bg-clay-deep">Join the list</button>
        </form>
        <p className="relative mt-3 text-[11px] text-linen/50">You can turn off marketing messages anytime in your account.</p>
      </div>
    </div>
  )
}

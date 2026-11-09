"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { loginAction } from "@/lib/actions"

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined)
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="label">Email or username</span>
        <input name="identifier" required autoComplete="username" className="input" placeholder="you@email.com or @username" />
      </label>
      <label className="block">
        <span className="label flex justify-between">
          Password
          <Link href="/forgot-password" className="normal-case tracking-normal text-clay hover:underline">Forgot?</Link>
        </span>
        <input name="password" type="password" required autoComplete="current-password" className="input" />
      </label>
      {state?.error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full py-4 text-base">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </button>
    </form>
  )
}

"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { resetPasswordAction } from "@/lib/actions"

export function ResetForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined)
  if (!token) return <p className="text-sm text-clay">This link is missing its token. <Link href="/forgot-password" className="underline">Request a new one</Link>.</p>
  if (state?.ok)
    return (
      <div className="space-y-6">
        <p className="card p-6 text-sm">{state.message}</p>
        <Link href="/login" className="btn-primary w-full py-4">Sign in</Link>
      </div>
    )
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <label className="block">
        <span className="label">New password</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </label>
      {state?.error && <p className="text-sm text-clay">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full py-4">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Update password
      </button>
    </form>
  )
}

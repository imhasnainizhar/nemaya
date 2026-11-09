"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { changePasswordAction } from "@/lib/actions"

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined)
  return (
    <form action={action} className="mt-6 max-w-md space-y-5">
      <label className="block">
        <span className="label">Current password</span>
        <input name="current_password" type="password" required autoComplete="current-password" className="input" />
      </label>
      <label className="block">
        <span className="label">New password</span>
        <input name="new_password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </label>
      {state?.error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p>}
      {state?.ok && <p className="rounded-2xl bg-moss/10 px-4 py-3 text-sm text-moss">{state.message}</p>}
      <button disabled={pending} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Update password</button>
    </form>
  )
}

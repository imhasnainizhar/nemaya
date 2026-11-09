"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2, MailCheck } from "lucide-react"
import { forgotPasswordAction } from "@/lib/actions"
import { AuthShell } from "@/components/auth-shell"

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined)
  return (
    <AuthShell title="Forgot password?" subtitle="We’ll email you a link to choose a new one.">
      {state?.ok ? (
        <div className="card flex items-start gap-3 p-6">
          <MailCheck className="h-6 w-6 shrink-0 text-moss" />
          <p className="text-sm">{state.message}</p>
        </div>
      ) : (
        <form action={action} className="space-y-5">
          <label className="block">
            <span className="label">Email</span>
            <input name="email" type="email" required autoComplete="email" className="input" />
          </label>
          {state?.error && <p className="text-sm text-clay">{state.error}</p>}
          <button disabled={pending} className="btn-primary w-full py-4">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
          </button>
        </form>
      )}
      <p className="mt-8 text-center text-sm"><Link href="/login" className="underline underline-offset-4">Back to sign in</Link></p>
    </AuthShell>
  )
}

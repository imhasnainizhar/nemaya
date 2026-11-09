"use client"

import { useActionState, useEffect, useState } from "react"
import { Check, Loader2, X } from "lucide-react"
import { checkUsername, registerAction } from "@/lib/actions"
import { AvatarPicker } from "@/components/avatar-picker"

export function RegisterForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(registerAction, undefined)
  const [avatar, setAvatar] = useState("av-01")
  const [username, setUsername] = useState("")
  const [check, setCheck] = useState<{ available: boolean; reason?: string } | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const u = username.trim()
    if (u.length < 3) return setCheck(null)
    setChecking(true)
    const t = setTimeout(async () => {
      setCheck(await checkUsername(u))
      setChecking(false)
    }, 350)
    return () => clearTimeout(t)
  }, [username])

  return (
    <form action={action} className="space-y-5">
      <AvatarPicker value={avatar} onChange={setAvatar} />
      <label className="block">
        <span className="label">Full name</span>
        <input name="full_name" required autoComplete="name" className="input" placeholder="Ayla Rahman" />
      </label>
      <label className="block">
        <span className="label">Username</span>
        <span className="relative block">
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-stone">@</span>
          <input
            name="username"
            required
            minLength={3}
            maxLength={20}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
            className="input pl-8"
            placeholder="ayla"
          />
          <span className="absolute top-1/2 right-4 -translate-y-1/2">
            {checking ? <Loader2 className="h-4 w-4 animate-spin text-stone" /> : check?.available ? <Check className="h-4 w-4 text-moss" /> : check ? <X className="h-4 w-4 text-clay" /> : null}
          </span>
        </span>
        {check && !check.available && <span className="mt-1.5 block text-xs text-clay">{check.reason}</span>}
        <span className="mt-1.5 block text-xs text-stone">You can change it twice every 30 days.</span>
      </label>
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="email" defaultValue={defaultEmail} className="input" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="At least 8 characters" />
      </label>
      {state?.error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p>}
      <button disabled={pending || (check !== null && !check.available)} className="btn-primary w-full py-4 text-base">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Create account
      </button>
    </form>
  )
}

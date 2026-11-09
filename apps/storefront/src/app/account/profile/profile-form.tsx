"use client"

import { useActionState, useState } from "react"
import { Loader2 } from "lucide-react"
import { updateProfileAction } from "@/lib/actions"
import { AvatarPicker } from "@/components/avatar-picker"
import type { Profile } from "@/lib/types"

export function ProfileForm({
  fullName,
  username,
  avatarId,
  quota,
  email,
}: {
  fullName: string
  username: string
  avatarId: string
  quota: Profile["username_quota"] | null
  email: string
}) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined)
  const [avatar, setAvatar] = useState(avatarId)
  const locked = quota ? quota.remaining <= 0 : false

  return (
    <form action={action} className="mt-8 max-w-lg space-y-6">
      <AvatarPicker value={avatar} onChange={setAvatar} />
      <label className="block">
        <span className="label">Full name</span>
        <input name="full_name" defaultValue={fullName} required className="input" />
      </label>
      <label className="block">
        <span className="label">Username</span>
        <span className="relative block">
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-stone">@</span>
          <input name="username" defaultValue={username} disabled={locked && !!username} className="input pl-8 disabled:opacity-60" />
        </span>
        {quota && (
          <span className="mt-1.5 block text-xs text-stone">
            {quota.remaining > 0
              ? `${quota.remaining} of ${quota.limit} changes left in this ${quota.window_days}-day window. Old usernames are held for 30 days.`
              : `You've used both changes. Next change available ${new Date(quota.next_available_at!).toLocaleDateString()}.`}
          </span>
        )}
      </label>
      <label className="block">
        <span className="label">Email</span>
        <input value={email} disabled className="input opacity-60" />
      </label>
      {state?.error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p>}
      {state?.ok && <p className="rounded-2xl bg-moss/10 px-4 py-3 text-sm text-moss">{state.message}</p>}
      <button disabled={pending} className="btn-primary">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
      </button>
    </form>
  )
}

import { getProfile } from "@/lib/data"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage() {
  const me = await getProfile()
  return (
    <div className="card p-6 sm:p-8">
      <h2 className="font-display text-3xl">Profile</h2>
      <p className="mt-1 text-sm text-stone">How you appear across Nemaya.</p>
      <ProfileForm
        fullName={me?.profile?.full_name || [me?.customer?.first_name, me?.customer?.last_name].filter(Boolean).join(" ")}
        username={me?.profile?.username ?? ""}
        avatarId={me?.profile?.avatar_id ?? "av-01"}
        quota={me?.profile?.username_quota ?? null}
        email={me?.customer?.email ?? ""}
      />
    </div>
  )
}

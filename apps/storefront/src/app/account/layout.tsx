import { redirect } from "next/navigation"
import { getProfile } from "@/lib/data"
import { Avatar } from "@/components/avatar"
import { AccountNav } from "./account-nav"

export const dynamic = "force-dynamic"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const me = await getProfile()
  if (!me?.customer) redirect("/login?next=/account")
  const name = me.profile?.full_name || [me.customer.first_name, me.customer.last_name].filter(Boolean).join(" ")

  return (
    <div className="container-x pt-12">
      <div className="flex items-center gap-5">
        <Avatar id={me.profile?.avatar_id} size={72} />
        <div>
          <p className="font-display text-4xl tracking-tight">{name || "Your account"}</p>
          <p className="text-sm text-stone">{me.profile ? `@${me.profile.username}` : "Finish setting up your profile"} · {me.customer.email}</p>
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}

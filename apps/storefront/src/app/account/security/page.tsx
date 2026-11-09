import { Monitor } from "lucide-react"
import { medusaSafe } from "@/lib/medusa"
import { timeAgo } from "@/lib/util"
import { PasswordForm } from "./password-form"

export default async function SecurityPage() {
  const res = await medusaSafe<{ devices: { id: string; label: string; last_ip: string | null; last_seen_at: string }[] }>("/store/me/devices")
  return (
    <div className="space-y-6">
      <section className="card p-6 sm:p-8">
        <h2 className="font-display text-3xl">Change password</h2>
        <p className="mt-1 text-sm text-stone">We’ll email you whenever your password changes.</p>
        <PasswordForm />
      </section>
      <section className="card p-6 sm:p-8">
        <h2 className="font-display text-3xl">Signed-in devices</h2>
        <p className="mt-1 text-sm text-stone">New devices trigger a security alert by email and push.</p>
        <ul className="mt-6 divide-y divide-bark/10">
          {(res?.devices ?? []).map((d) => (
            <li key={d.id} className="flex items-center gap-4 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-sand"><Monitor className="h-4 w-4" /></span>
              <span className="flex-1 text-sm">
                <span className="block font-semibold">{d.label}</span>
                <span className="block text-xs text-stone">{d.last_ip ?? "Unknown IP"} · last active {timeAgo(d.last_seen_at)}</span>
              </span>
            </li>
          ))}
          {!res?.devices?.length && <li className="py-4 text-sm text-stone">No sign-ins recorded yet.</li>}
        </ul>
      </section>
    </div>
  )
}

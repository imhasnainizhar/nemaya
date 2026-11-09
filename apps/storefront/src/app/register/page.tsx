import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCustomer } from "@/lib/data"
import { AuthShell } from "@/components/auth-shell"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = { title: "Create account" }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams
  if (await getCustomer()) redirect("/account")
  return (
    <AuthShell title="Join Nemaya" subtitle="Save favourites, get drop alerts and check out faster.">
      <RegisterForm defaultEmail={email ?? ""} />
      <p className="mt-8 text-center text-sm text-bark-soft">
        Already have an account? <Link href="/login" className="font-semibold text-bark underline underline-offset-4">Sign in</Link>
      </p>
    </AuthShell>
  )
}

import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCustomer } from "@/lib/data"
import { AuthShell } from "@/components/auth-shell"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  if (await getCustomer()) redirect(next || "/account")
  return (
    <AuthShell title="Welcome back" subtitle="Sign in with your email or username.">
      <LoginForm next={next ?? "/account"} />
      <p className="mt-8 text-center text-sm text-bark-soft">
        New to Nemaya? <Link href="/register" className="font-semibold text-bark underline underline-offset-4">Create an account</Link>
      </p>
      <div className="mt-6 rounded-2xl border border-bark/10 bg-sand/50 px-4 py-3 text-xs text-bark-soft">
        <span className="font-semibold text-bark">Just looking around?</span> Demo account: <span className="font-mono">ayla</span> / <span className="font-mono">Nemaya-Demo-2026</span>
      </div>
    </AuthShell>
  )
}

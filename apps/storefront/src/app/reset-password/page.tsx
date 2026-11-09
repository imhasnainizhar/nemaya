import { AuthShell } from "@/components/auth-shell"
import { ResetForm } from "./reset-form"

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const { token = "", email = "" } = await searchParams
  return (
    <AuthShell title="New password" subtitle={email ? `For ${email}` : undefined}>
      <ResetForm token={token} email={email} />
    </AuthShell>
  )
}

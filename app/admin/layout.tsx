import { AdminShell } from "@/components/AdminShell"
import { redirectToOnboardingIfNeeded, requireAdminAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await requireAdminAppUser()
  redirectToOnboardingIfNeeded(user)

  return <AdminShell user={serializeUser(user)}>{children}</AdminShell>
}

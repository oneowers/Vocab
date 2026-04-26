import { AppShell } from "@/components/AppShell"
import { requireSignedInAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await requireSignedInAppUser()

  return <AppShell user={user ? serializeUser(user) : null}>{children}</AppShell>
}


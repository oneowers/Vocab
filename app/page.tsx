import { AppShell } from "@/components/AppShell"
import { DashboardView } from "@/components/DashboardView"

import { requireSignedInAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"

export default async function HomePage() {
  const user = await requireSignedInAppUser()

  return (
    <AppShell user={user ? serializeUser(user) : null}>
      <DashboardView />
    </AppShell>
  )
}

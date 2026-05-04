export const dynamic = "force-dynamic"

import { AppShell } from "@/components/AppShell"
import { redirectToOnboardingIfNeeded, requireSignedInAppUser } from "@/lib/auth"
import { getOrCreateAppSettings } from "@/lib/catalog"
import { getPrisma } from "@/lib/prisma"
import { serializeAppSettings, serializeUser } from "@/lib/serializers"

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const prisma = getPrisma()
  const [user, settingsRaw] = await Promise.all([
    requireSignedInAppUser(),
    getOrCreateAppSettings(prisma)
  ])
  
  redirectToOnboardingIfNeeded(user)
  const settings = serializeAppSettings(settingsRaw)

  return (
    <AppShell 
      user={serializeUser(user)} 
      settings={settings}
    >
      {children}
    </AppShell>
  )
}

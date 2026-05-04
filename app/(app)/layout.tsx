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
  const user = await requireSignedInAppUser()
  redirectToOnboardingIfNeeded(user)
  
  const prisma = getPrisma()
  const settingsRaw = await getOrCreateAppSettings(prisma)
  const settings = serializeAppSettings(settingsRaw)

  return (
    <AppShell 
      user={user ? serializeUser(user) : null} 
      settings={settings}
    >
      {children}
    </AppShell>
  )
}

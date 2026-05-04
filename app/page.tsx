import { AppShell } from "@/components/AppShell"
import { HomeDashboardView } from "@/components/HomeDashboardView"

import { redirectToOnboardingIfNeeded, requireSignedInAppUser } from "@/lib/auth"
import { getOrCreateAppSettings } from "@/lib/catalog"
import { getPrisma } from "@/lib/prisma"
import { getUserCardsPageData } from "@/lib/server-data"
import { serializeAppSettings, serializeUser } from "@/lib/serializers"

export default async function HomePage() {
  const user = await requireSignedInAppUser()
  redirectToOnboardingIfNeeded(user)
  const cardsData = user ? await getUserCardsPageData(user.id) : null
  
  const prisma = getPrisma()
  const settingsRaw = await getOrCreateAppSettings(prisma)
  const settings = serializeAppSettings(settingsRaw)

  return (
    <AppShell 
      user={user ? serializeUser(user) : null} 
      settings={settings}
    >
      <HomeDashboardView 
        user={serializeUser(user!)} 
        initialCardsData={cardsData} 
      />
    </AppShell>
  )
}

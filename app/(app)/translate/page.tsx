import { AppShell } from "@/components/AppShell"
import { DashboardView } from "@/components/DashboardView"

import { requireSignedInAppUser } from "@/lib/auth"
import { getOrCreateAppSettings } from "@/lib/catalog"
import { getPrisma } from "@/lib/prisma"
import { getUserCardsPageData } from "@/lib/server-data"
import { serializeAppSettings, serializeUser } from "@/lib/serializers"

export default async function TranslatePage() {
  const user = await requireSignedInAppUser()
  const cardsData = user ? await getUserCardsPageData(user.id) : null
  
  const prisma = getPrisma()
  const settingsRaw = await getOrCreateAppSettings(prisma)
  const settings = serializeAppSettings(settingsRaw)

  return (
    <AppShell 
      user={user ? serializeUser(user) : null} 
      settings={settings}
    >
      <DashboardView 
        user={serializeUser(user!)} 
        initialDailyCatalog={cardsData?.dailyCatalog ?? null} 
      />
    </AppShell>
  )
}

import { Suspense } from "react"
import { DashboardView } from "@/components/DashboardView"
import { TranslateSkeleton } from "@/components/TranslateSkeleton"

import { requireSignedInAppUser } from "@/lib/auth"
import { getOrCreateAppSettings } from "@/lib/catalog"
import { getPrisma } from "@/lib/prisma"
import { getUserCardsPageData } from "@/lib/server-data"
import { serializeAppSettings, serializeUser } from "@/lib/serializers"

export default function TranslatePage() {
  return (
    <Suspense fallback={<TranslateSkeleton />}>
      <TranslateDataLoader />
    </Suspense>
  )
}

async function TranslateDataLoader() {
  const user = await requireSignedInAppUser()
  const cardsData = user ? await getUserCardsPageData(user.id) : null
  
  const prisma = getPrisma()
  const settingsRaw = await getOrCreateAppSettings(prisma)
  const _settings = serializeAppSettings(settingsRaw)

  return (
    <DashboardView 
      user={serializeUser(user!)} 
      initialDailyCatalog={cardsData?.dailyCatalog ?? null} 
    />
  )
}


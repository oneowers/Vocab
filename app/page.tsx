import { AppShell } from "@/components/AppShell"
import { DashboardView } from "@/components/DashboardView"

import { requireSignedInAppUser } from "@/lib/auth"
import { getUserCardsPageData } from "@/lib/server-data"
import { serializeUser } from "@/lib/serializers"

export default async function HomePage() {
  const user = await requireSignedInAppUser()
  const cardsData = user ? await getUserCardsPageData(user.id) : null

  return (
    <AppShell user={user ? serializeUser(user) : null}>
      <DashboardView initialDailyCatalog={cardsData?.dailyCatalog ?? null} />
    </AppShell>
  )
}

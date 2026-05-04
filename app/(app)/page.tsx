import { HomeDashboardView } from "@/components/HomeDashboardView"
import { redirectToOnboardingIfNeeded, requireSignedInAppUser } from "@/lib/auth"
import { getUserCardsPageData } from "@/lib/server-data"
import { serializeUser } from "@/lib/serializers"

export default async function HomePage() {
  console.time("[HomePage] Auth & Data Fetch")
  const user = await requireSignedInAppUser()
  redirectToOnboardingIfNeeded(user)
  
  const cardsData = user ? await getUserCardsPageData(user.id) : null
  
  console.timeEnd("[HomePage] Auth & Data Fetch")

  return (
    <HomeDashboardView 
      user={serializeUser(user!)} 
      initialCardsData={cardsData} 
    />
  )
}

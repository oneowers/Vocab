import { HomeDashboardView } from "@/components/HomeDashboardView"
import { requireSignedInAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"

export default async function HomePage() {
  const user = await requireSignedInAppUser()

  return (
    <HomeDashboardView 
      user={serializeUser(user)} 
      initialCardsData={null} 
    />
  )
}

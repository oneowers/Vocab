import { HomeDashboardView } from "@/components/HomeDashboardView"
import { requireSignedInAppUser } from "@/lib/auth"
import { getUserCardsPageData } from "@/lib/server-data"
import { serializeUser } from "@/lib/serializers"

export default async function HomePage() {
  const user = await requireSignedInAppUser()
  const initialData = await getUserCardsPageData(user.id)

  return (
    <HomeDashboardView 
      user={serializeUser(user)} 
      initialCardsData={initialData} 
    />
  )
}

import { CardsPageView } from "@/components/CardsPageView"
import { requireSignedInAppUser } from "@/lib/auth"
import { getUserCardsPageData } from "@/lib/server-data"
import { serializeUser } from "@/lib/serializers"

export default async function DashboardPage() {
  const user = await requireSignedInAppUser()
  const initialData = user ? await getUserCardsPageData(user.id) : null

  return (
    <CardsPageView 
      initialData={initialData} 
      user={user ? serializeUser(user) : null} 
    />
  )
}

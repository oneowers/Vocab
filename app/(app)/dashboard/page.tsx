import { CardsPageView } from "@/components/CardsPageView"
import { requireSignedInAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"

export default async function DashboardPage() {
  const user = await requireSignedInAppUser()

  return (
    <CardsPageView 
      initialData={null} 
      user={user ? serializeUser(user) : null} 
    />
  )
}

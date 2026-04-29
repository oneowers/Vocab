import { ProfileView } from "@/components/ProfileView"
import { requireSignedInAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"

export default async function ProfilePage() {
  const user = await requireSignedInAppUser()

  return <ProfileView user={user ? serializeUser(user) : null} initialActivity={null} />
}

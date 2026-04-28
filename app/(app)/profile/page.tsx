import { ProfileView } from "@/components/ProfileView"
import { requireSignedInAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"
import { getUserProfileActivityData } from "@/lib/server-data"
import { buildEmptyProfileActivity } from "@/lib/profile-data"

export default async function ProfilePage() {
  const user = await requireSignedInAppUser()
  const initialActivity = user
    ? await getUserProfileActivityData(user.id)
    : buildEmptyProfileActivity()

  return <ProfileView user={user ? serializeUser(user) : null} initialActivity={initialActivity} />
}

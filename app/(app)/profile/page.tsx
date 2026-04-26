import { ProfileView } from "@/components/ProfileView"
import { requireSignedInAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"
import { buildEmptyProfileActivity, buildProfileActivity } from "@/lib/server-data"

export default async function ProfilePage() {
  const user = await requireSignedInAppUser()

  const activity = user
    ? await buildProfileActivity(user.id)
    : buildEmptyProfileActivity()

  return <ProfileView user={user ? serializeUser(user) : null} activity={activity} />
}

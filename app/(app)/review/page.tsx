import { ReviewSession } from "@/components/ReviewSession"
import { requireSignedInAppUser } from "@/lib/auth"
import { getUserReviewData } from "@/lib/server-data"

export default async function ReviewPage() {
  const user = await requireSignedInAppUser()
  const initialData = user ? await getUserReviewData(user.id) : null

  return <ReviewSession initialData={initialData} />
}

import { ReviewSession } from "@/components/ReviewSession"
import { requireSignedInAppUser } from "@/lib/auth"

export default async function ReviewPage() {
  await requireSignedInAppUser()

  return <ReviewSession initialData={null} />
}

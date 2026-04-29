import { Suspense } from "react"
import { ReviewSession } from "@/components/ReviewSession"
import { requireSignedInAppUser } from "@/lib/auth"
import { getUserReviewData } from "@/lib/server-data"

export default async function PracticePage() {
  const user = await requireSignedInAppUser()
  const initialData = user ? await getUserReviewData(user.id) : null

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0c10] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" /></div>}>
      <ReviewSession initialData={initialData} />
    </Suspense>
  )
}

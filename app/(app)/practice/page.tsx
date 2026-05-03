import { Suspense } from "react"
import { requireSignedInAppUser } from "@/lib/auth"
import { getPracticePageData } from "@/lib/server-data"
import { PracticeView } from "@/components/PracticeView"

export default async function PracticePage({
  searchParams
}: {
  searchParams: { mode?: string }
}) {
  const user = await requireSignedInAppUser()
  const initialData = user ? await getPracticePageData(user.id) : null

  if (!initialData) return null

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0c10] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" /></div>}>
      <PracticeView 
        initialData={initialData} 
        initialMode={searchParams.mode as any}
      />
    </Suspense>
  )
}

import { Suspense } from "react"
import { DashboardView } from "@/components/DashboardView"

import { requireSignedInAppUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"

export default function TranslatePage() {
  return (
    <Suspense fallback={null}>
      <TranslateDataLoader />
    </Suspense>
  )
}

async function TranslateDataLoader() {
  const user = await requireSignedInAppUser()

  return (
    <DashboardView 
      user={serializeUser(user!)} 
      initialDailyCatalog={null} 
    />
  )
}

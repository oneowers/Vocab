export const dynamic = "force-dynamic"

import { OnboardingFlow } from "@/components/OnboardingFlow"
import {
  redirectAwayFromOnboardingIfCompleted,
  requireSignedInAppUser
} from "@/lib/auth"

export default async function OnboardingPage() {
  const user = await requireSignedInAppUser()
  redirectAwayFromOnboardingIfCompleted(user)

  return (
    <OnboardingFlow
      initialGoal={user.learningGoal}
      initialDailyWordTarget={user.dailyWordTarget}
      initialStep={user.onboardingStep}
    />
  )
}

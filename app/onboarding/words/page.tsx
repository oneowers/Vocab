import { redirect } from "next/navigation"

import { BrandLogo } from "@/components/BrandLogo"
import { OnboardingWordSelection } from "@/components/OnboardingWordSelection"
import { requireSignedInAppUser } from "@/lib/auth"
import { buildOnboardingWordSelection } from "@/lib/onboarding-words"
import { getPrisma } from "@/lib/prisma"

export default async function OnboardingWordsPage() {
  const user = await requireSignedInAppUser()

  if (user.onboardingCompletedAt) {
    redirect("/dashboard")
  }

  if (user.onboardingStep === "QUESTIONS") {
    redirect("/onboarding")
  }

  if (user.onboardingStep === "LEVEL_TEST") {
    redirect("/onboarding/level-test")
  }

  const selection = await buildOnboardingWordSelection(getPrisma(), user)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
      <div className="w-full">
        <div className="mb-5 flex items-center gap-3 px-1">
          <div className="brand-mark h-12 w-12 text-lg font-semibold">
            <BrandLogo />
          </div>
          <div>
            <p className="section-label">LexiFlow</p>
            <p className="mt-1 text-[22px] font-bold tracking-normal text-text-primary">
              First words
            </p>
          </div>
        </div>

        <OnboardingWordSelection initialSelection={selection} />
      </div>
    </div>
  )
}

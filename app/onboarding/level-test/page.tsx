export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

import { BrandLogo } from "@/components/BrandLogo"
import { VocabularyLevelTest } from "@/components/VocabularyLevelTest"
import { requireSignedInAppUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { buildVocabularyLevelTest } from "@/lib/vocabulary-level-test"

export default async function OnboardingLevelTestPage() {
  const user = await requireSignedInAppUser()

  if (user.onboardingStep === "FIRST_WORDS") {
    redirect("/onboarding/words")
  }

  if (!user.onboardingCompletedAt && user.onboardingStep !== "LEVEL_TEST") {
    redirect("/onboarding")
  }

  const initialTest = await buildVocabularyLevelTest(getPrisma())

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
      <div className="w-full">
        <div className="mb-4 flex items-center gap-3 px-1">
          <div className="brand-mark h-12 w-12 text-lg font-semibold">
            <BrandLogo />
          </div>
          <div>
            <p className="section-label">LexiFlow</p>
            <h1 className="mt-1 text-[22px] font-bold tracking-[-0.04em] text-text-primary">
              Vocabulary level test
            </h1>
          </div>
        </div>
        <VocabularyLevelTest initialTest={initialTest} />
      </div>
    </div>
  )
}

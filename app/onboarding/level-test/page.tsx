import Link from "next/link"
import { redirect } from "next/navigation"

import { BrandLogo } from "@/components/BrandLogo"
import { requireSignedInAppUser } from "@/lib/auth"

export default async function OnboardingLevelTestPage() {
  const user = await requireSignedInAppUser()

  if (!user.onboardingCompletedAt && user.onboardingStep !== "LEVEL_TEST") {
    redirect("/onboarding")
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
      <div className="panel w-full p-6 md:p-8">
        <div className="flex items-center gap-3">
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

        <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-[15px] leading-7 text-text-secondary">
            You reached the level-test step. The actual test flow is the next phase, and your
            onboarding answers are already saved.
          </p>
        </div>

        <Link href="/" prefetch className="button-primary mt-8 w-full justify-center">
          Continue to dashboard
        </Link>
      </div>
    </div>
  )
}

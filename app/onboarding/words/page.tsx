import Link from "next/link"
import { redirect } from "next/navigation"

import { BrandLogo } from "@/components/BrandLogo"
import { requireSignedInAppUser } from "@/lib/auth"

export default async function OnboardingWordsPage() {
  const user = await requireSignedInAppUser()

  if (user.onboardingStep === "QUESTIONS") {
    redirect("/onboarding")
  }

  if (user.onboardingStep === "LEVEL_TEST") {
    redirect("/onboarding/level-test")
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
            <h1 className="mt-1 text-[22px] font-bold tracking-normal text-text-primary">
              First words
            </h1>
          </div>
        </div>

        <div className="mt-8 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-[15px] leading-7 text-text-secondary">
            Your level test is saved. First daily word selection is the next phase, and this
            screen is ready to receive that flow.
          </p>
        </div>

        <Link href="/dashboard" prefetch className="button-primary mt-8 w-full justify-center">
          Continue to dashboard
        </Link>
      </div>
    </div>
  )
}

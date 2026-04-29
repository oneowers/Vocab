"use client"

import { ArrowRight, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { BrandLogo } from "@/components/BrandLogo"
import { useToast } from "@/components/Toast"
import {
  ONBOARDING_DAILY_TARGET_OPTIONS,
  ONBOARDING_GOAL_OPTIONS,
  getOnboardingProgressStep,
  type DailyWordTargetValue,
  type LearningGoalValue
} from "@/lib/onboarding"

interface OnboardingFlowProps {
  initialGoal: LearningGoalValue | null
  initialDailyWordTarget: number | null
  initialStep: "QUESTIONS" | "LEVEL_TEST" | "FIRST_WORDS" | "COMPLETED"
}

type FlowStep = 1 | 2 | 3

function getStepTitle(step: FlowStep) {
  if (step === 1) {
    return "Why are you learning English?"
  }

  if (step === 2) {
    return "How many words per day feels realistic?"
  }

  return "Start vocabulary level test"
}

export function OnboardingFlow({
  initialGoal,
  initialDailyWordTarget,
  initialStep
}: OnboardingFlowProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [selectedGoal, setSelectedGoal] = useState<LearningGoalValue | null>(initialGoal)
  const [selectedDailyWordTarget, setSelectedDailyWordTarget] = useState<number | null>(
    initialDailyWordTarget
  )
  const [currentStep, setCurrentStep] = useState<FlowStep>(
    getOnboardingProgressStep({
      learningGoal: initialGoal,
      dailyWordTarget: initialDailyWordTarget,
      onboardingStep: initialStep
    }) as FlowStep
  )
  const [saving, setSaving] = useState(false)

  async function saveStep(payload: {
    learningGoal?: LearningGoalValue
    dailyWordTarget?: DailyWordTargetValue
    onboardingStep?: "QUESTIONS" | "LEVEL_TEST"
    complete?: boolean
  }) {
    setSaving(true)

    try {
      const response = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Could not save onboarding.")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleContinue() {
    try {
      if (currentStep === 1) {
        if (!selectedGoal) {
          showToast("Choose one goal to continue.", "error")
          return
        }

        await saveStep({
          learningGoal: selectedGoal,
          onboardingStep: "QUESTIONS"
        })
        setCurrentStep(2)
        return
      }

      if (currentStep === 2) {
        if (
          selectedDailyWordTarget !== 5 &&
          selectedDailyWordTarget !== 10 &&
          selectedDailyWordTarget !== 15 &&
          selectedDailyWordTarget !== 20
        ) {
          showToast("Choose a realistic daily target to continue.", "error")
          return
        }

        await saveStep({
          dailyWordTarget: selectedDailyWordTarget,
          onboardingStep: "QUESTIONS"
        })
        setCurrentStep(3)
        return
      }

      await saveStep({
        onboardingStep: "LEVEL_TEST"
      })
      router.push("/onboarding/level-test")
      router.refresh()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not save onboarding.",
        "error"
      )
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
      <div className="panel w-full overflow-hidden p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="brand-mark h-12 w-12 text-lg font-semibold">
            <BrandLogo />
          </div>
          <div>
            <p className="section-label">LexiFlow</p>
            <h1 className="mt-1 text-[22px] font-bold tracking-[-0.04em] text-text-primary">
              Let&apos;s tune your start
            </h1>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full ${
                step <= currentStep ? "bg-white" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-text-tertiary">
            Step {currentStep} of 3
          </p>
          <h2 className="mt-3 text-[28px] font-bold tracking-[-0.05em] text-white">
            {getStepTitle(currentStep)}
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-text-secondary">
            {currentStep === 1
              ? "A quick goal helps us make the first study path feel relevant."
              : currentStep === 2
                ? "Choose a pace that feels calm and realistic for daily learning."
                : "Next you&apos;ll move into the vocabulary level test step."}
          </p>
        </div>

        {currentStep === 1 ? (
          <div className="mt-8 grid gap-3">
            {ONBOARDING_GOAL_OPTIONS.map((option) => {
              const active = option.value === selectedGoal

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedGoal(option.value)}
                  className={`flex min-h-[60px] items-center justify-between rounded-[20px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-white bg-white text-black"
                      : "border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-[15px] font-semibold">{option.label}</span>
                  {active ? <CheckCircle2 size={18} /> : null}
                </button>
              )
            })}
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {ONBOARDING_DAILY_TARGET_OPTIONS.map((value) => {
              const active = value === selectedDailyWordTarget

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedDailyWordTarget(value)}
                  className={`rounded-[22px] border px-4 py-5 text-left transition ${
                    active
                      ? "border-white bg-white text-black"
                      : "border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="text-[28px] font-bold tracking-[-0.05em]">{value}</p>
                  <p className={`mt-1 text-[13px] ${active ? "text-black/70" : "text-text-tertiary"}`}>
                    words per day
                  </p>
                </button>
              )
            })}
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5">
            <p className="text-[15px] leading-7 text-text-secondary">
              Your answers are saved. The next step is the vocabulary level test entry point.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep((step) => (step > 1 ? ((step - 1) as FlowStep) : step))}
            disabled={saving || currentStep === 1}
            className="button-secondary min-w-[108px] justify-center disabled:opacity-40"
          >
            Back
          </button>

          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={saving}
            className="button-primary min-w-[170px] justify-center"
          >
            {saving ? "Saving..." : currentStep === 3 ? "Start test" : (
              <>
                Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

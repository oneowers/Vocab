import type { LearningGoal, OnboardingStep, User } from "@prisma/client"

export const ONBOARDING_GOAL_OPTIONS = [
  { value: "IELTS", label: "IELTS" },
  { value: "WORK", label: "Work" },
  { value: "DAILY_ENGLISH", label: "Daily English" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OTHER", label: "Other" }
] as const

export const ONBOARDING_DAILY_TARGET_OPTIONS = [5, 10, 15, 20] as const

export type LearningGoalValue = (typeof ONBOARDING_GOAL_OPTIONS)[number]["value"]
export type DailyWordTargetValue = (typeof ONBOARDING_DAILY_TARGET_OPTIONS)[number]
export type OnboardingStepValue = "QUESTIONS" | "LEVEL_TEST" | "FIRST_WORDS" | "COMPLETED"

export function isLearningGoalValue(value: string): value is LearningGoalValue {
  return ONBOARDING_GOAL_OPTIONS.some((option) => option.value === value)
}

export function isDailyWordTargetValue(value: number): value is DailyWordTargetValue {
  return ONBOARDING_DAILY_TARGET_OPTIONS.includes(value as DailyWordTargetValue)
}

export function isOnboardingStepValue(value: string): value is OnboardingStepValue {
  return (
    value === "QUESTIONS" ||
    value === "LEVEL_TEST" ||
    value === "FIRST_WORDS" ||
    value === "COMPLETED"
  )
}

export function getOnboardingRouteForUser(
  user: Pick<User, "onboardingCompletedAt" | "onboardingStep"> | null
) {
  if (!user || user.onboardingCompletedAt) {
    return null
  }

  if (user.onboardingStep === "LEVEL_TEST") {
    return "/onboarding/level-test"
  }

  if (user.onboardingStep === "FIRST_WORDS") {
    return "/onboarding/words"
  }

  return "/onboarding"
}

export function getOnboardingProgressStep(user: {
  learningGoal: LearningGoal | null
  dailyWordTarget: number | null
  onboardingStep: OnboardingStep
}) {
  if (
    user.onboardingStep === "LEVEL_TEST" ||
    user.onboardingStep === "FIRST_WORDS" ||
    user.onboardingStep === "COMPLETED"
  ) {
    return 3
  }

  if (user.dailyWordTarget) {
    return 3
  }

  if (user.learningGoal) {
    return 2
  }

  return 1
}

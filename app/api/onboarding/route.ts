import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import {
  isDailyWordTargetValue,
  isLearningGoalValue,
  isOnboardingStepValue
} from "@/lib/onboarding"
import { getPrisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | {
        learningGoal?: string
        dailyWordTarget?: number
        onboardingStep?: string
        complete?: boolean
      }
    | null

  const nextLearningGoal =
    typeof body?.learningGoal === "string" && isLearningGoalValue(body.learningGoal)
      ? body.learningGoal
      : undefined
  const nextDailyWordTarget =
    typeof body?.dailyWordTarget === "number" && isDailyWordTargetValue(body.dailyWordTarget)
      ? body.dailyWordTarget
      : undefined
  const nextOnboardingStep =
    typeof body?.onboardingStep === "string" && isOnboardingStepValue(body.onboardingStep)
      ? body.onboardingStep
      : undefined
  const shouldComplete = body?.complete === true

  if (
    nextLearningGoal === undefined &&
    nextDailyWordTarget === undefined &&
    nextOnboardingStep === undefined &&
    !shouldComplete
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const updatedUser = await getPrisma().user.update({
    where: {
      id: user.id
    },
    data: {
      ...(nextLearningGoal !== undefined ? { learningGoal: nextLearningGoal } : {}),
      ...(nextDailyWordTarget !== undefined ? { dailyWordTarget: nextDailyWordTarget } : {}),
      ...(nextOnboardingStep !== undefined ? { onboardingStep: nextOnboardingStep } : {}),
      ...(shouldComplete
        ? {
            onboardingStep: "COMPLETED",
            onboardingCompletedAt: new Date()
          }
        : {})
    },
    select: {
      learningGoal: true,
      dailyWordTarget: true,
      onboardingStep: true,
      onboardingCompletedAt: true
    }
  })

  return NextResponse.json({
    onboarding: {
      learningGoal: updatedUser.learningGoal,
      dailyWordTarget: updatedUser.dailyWordTarget,
      onboardingStep: updatedUser.onboardingStep,
      onboardingCompletedAt: updatedUser.onboardingCompletedAt?.toISOString() ?? null
    }
  })
}

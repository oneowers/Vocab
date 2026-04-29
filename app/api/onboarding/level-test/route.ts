import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import {
  buildVocabularyLevelTest,
  evaluateVocabularyLevelTest
} from "@/lib/vocabulary-level-test"

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.onboardingStep !== "LEVEL_TEST" && !user.onboardingCompletedAt) {
    return NextResponse.json({ error: "Level test is not available yet." }, { status: 409 })
  }

  return NextResponse.json(await buildVocabularyLevelTest(getPrisma()))
}

export async function POST(request: Request) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | {
        answers?: Array<{
          questionId?: string
          selectedOptionId?: string
        }>
      }
    | null
  const answers = Array.isArray(body?.answers)
    ? body.answers
        .map((answer) => ({
          questionId: typeof answer.questionId === "string" ? answer.questionId : "",
          selectedOptionId: typeof answer.selectedOptionId === "string" ? answer.selectedOptionId : ""
        }))
        .filter((answer) => answer.questionId && answer.selectedOptionId)
    : []

  if (answers.length !== 10) {
    return NextResponse.json({ error: "Answer all 10 questions to finish the test." }, { status: 400 })
  }

  const prisma = getPrisma()
  const result = await evaluateVocabularyLevelTest(prisma, answers)
  const updatedUser = await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      cefrLevel: result.estimatedLevel,
      levelTestEstimatedLevel: result.estimatedLevel,
      levelTestConfidence: result.confidenceByLevel,
      levelTestCompletedAt: new Date(),
      levelTestMistakes: result.mistakesCount,
      levelTestCorrect: result.correctCount,
      onboardingStep: "FIRST_WORDS"
    },
    select: {
      cefrLevel: true,
      levelTestEstimatedLevel: true,
      levelTestConfidence: true,
      levelTestCompletedAt: true,
      levelTestMistakes: true,
      levelTestCorrect: true,
      onboardingStep: true
    }
  })

  return NextResponse.json({
    result: {
      estimatedLevel: updatedUser.levelTestEstimatedLevel,
      confidenceByLevel: updatedUser.levelTestConfidence,
      testCompletedAt: updatedUser.levelTestCompletedAt?.toISOString() ?? null,
      mistakesCount: updatedUser.levelTestMistakes,
      correctCount: updatedUser.levelTestCorrect,
      onboardingStep: updatedUser.onboardingStep
    }
  })
}

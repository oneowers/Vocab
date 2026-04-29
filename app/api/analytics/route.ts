import { NextRequest, NextResponse } from "next/server"
import { getTodayDateKey } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"

const eventMap: Record<string, string> = {
  "onboarding_started": "onboardingStarted",
  "onboarding_completed": "onboardingCompleted",
  "level_test_started": "levelTestStarted",
  "level_test_completed": "levelTestCompleted",
  "first_words_selected": "firstWordsSelected",
  "first_practice_started": "firstPracticeStarted",
  "first_practice_completed": "firstPracticeCompleted",
  "ai_challenge_started": "aiChallengeStarted",
  "ai_challenge_completed": "aiChallengeCompleted",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const eventName = body.event as string

    if (!eventName || !eventMap[eventName]) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    }

    const field = eventMap[eventName]
    const today = getTodayDateKey()
    const prisma = getPrisma()

    await prisma.appAnalytics.upsert({
      where: { date: today },
      update: {
        [field]: { increment: 1 }
      },
      create: {
        date: today,
        [field]: 1
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

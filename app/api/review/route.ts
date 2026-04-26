import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getTodayDateKey, getYesterdayDateKey } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import { serializeCard } from "@/lib/serializers"
import { getReviewOutcome } from "@/lib/spaced-repetition"

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    cardId?: string
    result?: "known" | "unknown"
  }

  if (!body.cardId || (body.result !== "known" && body.result !== "unknown")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const prisma = getPrisma()
  const card = await prisma.card.findFirst({
    where: {
      id: body.cardId,
      userId: user.id
    }
  })

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 })
  }

  const today = getTodayDateKey()
  const yesterday = getYesterdayDateKey(today)
  const outcome = getReviewOutcome(body.result, today)
  const firstReviewToday = user.lastReviewDate !== today
  const nextStreak =
    user.lastReviewDate === today
      ? user.streak
      : user.lastReviewDate === yesterday
        ? user.streak + 1
        : 1

  const [updatedCard] = await prisma.$transaction([
    prisma.card.update({
      where: {
        id: card.id
      },
      data: {
        nextReviewDate: outcome.nextReviewDate,
        lastReviewResult: outcome.lastReviewResult,
        reviewCount: {
          increment: outcome.reviewCountDelta
        },
        correctCount: {
          increment: outcome.correctCountDelta
        },
        wrongCount: {
          increment: outcome.wrongCountDelta
        }
      }
    }),
    prisma.reviewLog.create({
      data: {
        userId: user.id,
        cardId: card.id,
        result: body.result
      }
    }),
    prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        streak: nextStreak,
        lastReviewDate: today,
        lastActiveAt: new Date()
      }
    }),
    prisma.appAnalytics.upsert({
      where: {
        date: today
      },
      update: {
        totalReviews: {
          increment: 1
        },
        totalSessions: {
          increment: firstReviewToday ? 1 : 0
        }
      },
      create: {
        date: today,
        totalReviews: 1,
        totalSessions: 1
      }
    })
  ])

  return NextResponse.json({
    card: serializeCard(updatedCard),
    streak: nextStreak
  })
}

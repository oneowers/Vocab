import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { serializedCardSelect } from "@/lib/db-selects"
import { getTodayDateKey, getYesterdayDateKey } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag, userCacheTag } from "@/lib/server-cache"
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
    },
    select: serializedCardSelect
  })

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 })
  }

  const today = getTodayDateKey()
  const yesterday = getYesterdayDateKey(today)
  const outcome = getReviewOutcome(body.result, today)
  const firstReviewToday = user.lastReviewDate !== today
  let nextStreak = user.streak
  let usedFreeze = false

  if (user.lastReviewDate !== today) {
    if (user.lastReviewDate === yesterday) {
      nextStreak = user.streak + 1
    } else if (user.streakFreezes > 0) {
      usedFreeze = true
      nextStreak = user.streak
    } else {
      nextStreak = 1
    }
  }

  const [updatedCard] = await prisma.$transaction([
    prisma.card.update({
      where: {
        id: card.id
      },
      select: serializedCardSelect,
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
        streakFreezes: usedFreeze ? { decrement: 1 } : undefined,
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

  revalidateTag(userCacheTag.cards(user.id))
  revalidateTag(userCacheTag.review(user.id))
  revalidateTag(userCacheTag.stats(user.id))
  revalidateTag(userCacheTag.profile(user.id))
  revalidateTag(adminCacheTag.analytics)

  return NextResponse.json({
    card: serializeCard(updatedCard),
    streak: nextStreak
  })
}

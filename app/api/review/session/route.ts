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
    reviews?: Array<{
      cardId?: string
      result?: "known" | "unknown"
    }>
  }

  if (!Array.isArray(body.reviews) || !body.reviews.length) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const validReviews = body.reviews.filter(
    (review): review is { cardId: string; result: "known" | "unknown" } =>
      typeof review.cardId === "string" &&
      (review.result === "known" || review.result === "unknown")
  )

  if (validReviews.length !== body.reviews.length) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const dedupedReviews = Array.from(
    new Map(validReviews.map((review) => [review.cardId, review])).values()
  )

  const prisma = getPrisma()
  const cards = await prisma.card.findMany({
    where: {
      userId: user.id,
      id: {
        in: dedupedReviews.map((review) => review.cardId)
      }
    },
    select: serializedCardSelect
  })

  if (cards.length !== dedupedReviews.length) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 })
  }

  const cardMap = new Map(cards.map((card) => [card.id, card]))
  const today = getTodayDateKey()
  const yesterday = getYesterdayDateKey(today)
  const firstReviewToday = user.lastReviewDate !== today
  const nextStreak =
    user.lastReviewDate === today
      ? user.streak
      : user.lastReviewDate === yesterday
        ? user.streak + 1
        : 1

  const operations = dedupedReviews.flatMap((review) => {
    const card = cardMap.get(review.cardId)

    if (!card) {
      return []
    }

    const outcome = getReviewOutcome(review.result, today)

    return [
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
          result: review.result
        }
      })
    ]
  })

  const transactionResult = await prisma.$transaction([
    ...operations,
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
          increment: dedupedReviews.length
        },
        totalSessions: {
          increment: firstReviewToday ? 1 : 0
        }
      },
      create: {
        date: today,
        totalReviews: dedupedReviews.length,
        totalSessions: 1
      }
    })
  ])

  const updatedCards = transactionResult.filter(
    (item): item is (typeof cards)[number] => "nextReviewDate" in item && "direction" in item
  )

  revalidateTag(userCacheTag.cards(user.id))
  revalidateTag(userCacheTag.review(user.id))
  revalidateTag(userCacheTag.stats(user.id))
  revalidateTag(userCacheTag.profile(user.id))
  revalidateTag(adminCacheTag.analytics)

  return NextResponse.json({
    cards: updatedCards.map((card) => serializeCard(card)),
    streak: nextStreak
  })
}

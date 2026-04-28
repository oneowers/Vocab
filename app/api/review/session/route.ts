import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { getTodayDateKey, getYesterdayDateKey } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag, userCacheTag } from "@/lib/server-cache"
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
  const matchingCardsCount = await prisma.card.count({
    where: {
      userId: user.id,
      id: {
        in: dedupedReviews.map((review) => review.cardId)
      }
    }
  })

  if (matchingCardsCount !== dedupedReviews.length) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 })
  }
  const today = getTodayDateKey()
  const yesterday = getYesterdayDateKey(today)
  const firstReviewToday = user.lastReviewDate !== today
  const nextStreak =
    user.lastReviewDate === today
      ? user.streak
      : user.lastReviewDate === yesterday
        ? user.streak + 1
        : 1

  const reviewIdsByResult = dedupedReviews.reduce<Record<"known" | "unknown", string[]>>(
    (accumulator, review) => {
      accumulator[review.result].push(review.cardId)
      return accumulator
    },
    { known: [], unknown: [] }
  )
  const cardUpdateOperations = (["known", "unknown"] as const)
    .filter((result) => reviewIdsByResult[result].length > 0)
    .map((result) => {
      const outcome = getReviewOutcome(result, today)

      return prisma.card.updateMany({
        where: {
          userId: user.id,
          id: {
            in: reviewIdsByResult[result]
          }
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
      })
    })

  await prisma.$transaction([
    ...cardUpdateOperations,
    prisma.reviewLog.createMany({
      data: dedupedReviews.map((review) => ({
        userId: user.id,
        cardId: review.cardId,
        result: review.result
      }))
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
    })
  ])

  revalidateTag(userCacheTag.cards(user.id))
  revalidateTag(userCacheTag.stats(user.id))
  revalidateTag(userCacheTag.profile(user.id))

  void prisma.appAnalytics.upsert({
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
  }).then(() => {
    revalidateTag(adminCacheTag.analytics)
  }).catch((error: unknown) => {
    console.error("Failed to update app analytics after review session", error)
  })

  return NextResponse.json({
    updatedCardIds: dedupedReviews.map((review) => review.cardId),
    streak: nextStreak
  })
}

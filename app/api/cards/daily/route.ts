import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { ensureCatalogWordLocalized } from "@/lib/catalog"
import { serializedCardSelect } from "@/lib/db-selects"
import { getTodayDateKey } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag, userCacheTag } from "@/lib/server-cache"
import { serializeCard, type SerializableCard } from "@/lib/serializers"
import type { CefrLevel } from "@/lib/types"

async function getDailyWordsContext(userId: string, cefrLevel: CefrLevel) {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const todayStart = new Date(`${today}T00:00:00.000Z`)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      dailyWordTarget: true
    }
  })
  const dailyTarget =
    typeof user.dailyWordTarget === "number" && user.dailyWordTarget > 0 ? user.dailyWordTarget : 10
  const claimedToday = await prisma.userCatalogWord.count({
    where: {
      userId,
      status: "ACTIVE",
      createdAt: {
        gte: todayStart,
        lt: tomorrowStart
      }
    }
  })
  const [totalCards, dueCardCount] = await Promise.all([
    prisma.card.count({
      where: {
        userId
      }
    }),
    prisma.card.count({
      where: {
        userId,
        nextReviewDate: {
          lte: today
        }
      }
    })
  ])

  const remainingToday = Math.max(dailyTarget - claimedToday, 0)

  if (!remainingToday) {
    return {
      prisma,
      today,
      dailyTarget,
      totalCards,
      dueCardCount,
      claimedToday,
      remainingToday,
      eligibleWords: []
    }
  }

  const existingClaimIds = await prisma.userCatalogWord.findMany({
    where: {
      userId
    },
    select: {
      wordCatalogId: true
    }
  })

  const eligibleWords = await prisma.wordCatalog.findMany({
    where: {
      isPublished: true,
      cefrLevel,
      id: {
        notIn: existingClaimIds.map((item) => item.wordCatalogId)
      }
    },
    orderBy: [
      {
        priority: "desc"
      },
      {
        createdAt: "asc"
      }
    ],
    take: remainingToday
  })

  return {
    prisma,
    today,
    dailyTarget,
    totalCards,
    dueCardCount,
    claimedToday,
    remainingToday,
    eligibleWords
  }
}

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { dailyTarget, totalCards, dueCardCount, claimedToday, remainingToday, eligibleWords } = await getDailyWordsContext(
    user.id,
    user.cefrLevel
  )
  const todayCount = Math.min(dueCardCount, dailyTarget)
  const waitingCount = Math.max(totalCards - todayCount, 0)

  return NextResponse.json({
    items: eligibleWords.map((word) => ({
      id: word.id,
      word: word.word,
      translation: word.translation,
      example: word.example?.trim() || null,
      cefrLevel: word.cefrLevel
    })),
    dailyTarget,
    todayCount,
    savedCount: totalCards,
    waitingCount,
    claimedToday,
    dailyLimit: dailyTarget,
    remainingToday,
    limitReached: remainingToday === 0
  })
}

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | { wordCatalogIds?: string[] }
    | null
  const requestedIds = Array.isArray(body?.wordCatalogIds)
    ? Array.from(new Set(body.wordCatalogIds.filter((value): value is string => typeof value === "string")))
    : []
  const { prisma, today, dailyTarget, totalCards, dueCardCount, claimedToday, remainingToday, eligibleWords } =
    await getDailyWordsContext(user.id, user.cefrLevel)

  if (!remainingToday) {
    return NextResponse.json({
      cards: [],
      createdCount: 0,
      dailyTarget,
      todayCount: Math.min(dueCardCount, dailyTarget),
      savedCount: totalCards,
      waitingCount: Math.max(totalCards - Math.min(dueCardCount, dailyTarget), 0),
      claimedToday,
      dailyLimit: dailyTarget,
      remainingToday: 0,
      limitReached: true
    })
  }

  if (!eligibleWords.length) {
    return NextResponse.json({
      cards: [],
      createdCount: 0,
      dailyTarget,
      todayCount: Math.min(dueCardCount, dailyTarget),
      savedCount: totalCards,
      waitingCount: Math.max(totalCards - Math.min(dueCardCount, dailyTarget), 0),
      claimedToday,
      dailyLimit: dailyTarget,
      remainingToday,
      limitReached: false
    })
  }

  const selectedWords =
    requestedIds.length > 0
      ? eligibleWords.filter((word) => requestedIds.includes(word.id))
      : eligibleWords
  const wordsToClaim = selectedWords.slice(0, remainingToday)

  if (!wordsToClaim.length) {
    return NextResponse.json({
      cards: [],
      createdCount: 0,
      dailyTarget,
      todayCount: Math.min(dueCardCount, dailyTarget),
      savedCount: totalCards,
      waitingCount: Math.max(totalCards - Math.min(dueCardCount, dailyTarget), 0),
      claimedToday,
      dailyLimit: dailyTarget,
      remainingToday,
      limitReached: false
    })
  }

  const localizedWords = await Promise.all(
    wordsToClaim.map((word) => ensureCatalogWordLocalized(prisma, word.id))
  )
  const readyWords = localizedWords.filter((word): word is NonNullable<typeof word> => Boolean(word))

  if (!readyWords.length) {
    return NextResponse.json({
      cards: [],
      createdCount: 0,
      dailyTarget,
      todayCount: Math.min(dueCardCount, dailyTarget),
      savedCount: totalCards,
      waitingCount: Math.max(totalCards - Math.min(dueCardCount, dailyTarget), 0),
      claimedToday,
      dailyLimit: dailyTarget,
      remainingToday,
      limitReached: false
    })
  }

  const cardCreateOperations = readyWords.map((word) =>
    prisma.card.create({
      data: {
        userId: user.id,
        catalogWordId: word.id,
        original: null,
        translation: null,
        direction: "en-ru",
        example: null,
        phonetic: null,
        nextReviewDate: today,
        lastReviewResult: "unknown"
      },
      select: serializedCardSelect
    })
  )

  const transactionResults = await prisma.$transaction([
    prisma.userCatalogWord.createMany({
      data: readyWords.map((word) => ({
        userId: user.id,
        wordCatalogId: word.id,
        status: "ACTIVE"
      })),
      skipDuplicates: true
    }),
    ...cardCreateOperations,
    prisma.appAnalytics.upsert({
      where: {
        date: today
      },
      update: {
        newCards: {
          increment: readyWords.length
        }
      },
      create: {
        date: today,
        newCards: readyWords.length
      }
    })
  ])

  const createdCards = transactionResults.slice(
    1,
    transactionResults.length - 1
  ) as SerializableCard[]

  const nextClaimedToday = claimedToday + createdCards.length
  const nextSavedCount = totalCards + createdCards.length
  const nextTodayCount = Math.min(dueCardCount + createdCards.length, dailyTarget)

  if (createdCards.length) {
    revalidateTag(userCacheTag.cards(user.id))
    revalidateTag(userCacheTag.review(user.id))
    revalidateTag(userCacheTag.stats(user.id))
    revalidateTag(adminCacheTag.analytics)
  }

  return NextResponse.json({
    cards: createdCards.map((card) => serializeCard(card)),
    createdCount: createdCards.length,
    dailyTarget,
    todayCount: nextTodayCount,
    savedCount: nextSavedCount,
    waitingCount: Math.max(nextSavedCount - nextTodayCount, 0),
    claimedToday: nextClaimedToday,
    dailyLimit: dailyTarget,
    remainingToday: Math.max(dailyTarget - nextClaimedToday, 0),
    limitReached: nextClaimedToday >= dailyTarget
  })
}

import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getOrCreateAppSettings } from "@/lib/catalog"
import { getTodayDateKey } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import { serializeCard } from "@/lib/serializers"

export async function POST() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrisma()
  const today = getTodayDateKey()
  const todayStart = new Date(`${today}T00:00:00.000Z`)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)
  const settings = await getOrCreateAppSettings(prisma)
  const claimedToday = await prisma.userCatalogWord.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: todayStart,
        lt: tomorrowStart
      }
    }
  })

  const remainingToday = Math.max(settings.dailyNewCardsLimit - claimedToday, 0)

  if (!remainingToday) {
    return NextResponse.json({
      cards: [],
      createdCount: 0,
      claimedToday,
      dailyLimit: settings.dailyNewCardsLimit,
      remainingToday: 0,
      limitReached: true
    })
  }

  const existingClaimIds = await prisma.userCatalogWord.findMany({
    where: {
      userId: user.id
    },
    select: {
      wordCatalogId: true
    }
  })

  const nextWords = await prisma.wordCatalog.findMany({
    where: {
      isPublished: true,
      cefrLevel: user.cefrLevel,
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

  if (!nextWords.length) {
    return NextResponse.json({
      cards: [],
      createdCount: 0,
      claimedToday,
      dailyLimit: settings.dailyNewCardsLimit,
      remainingToday,
      limitReached: false
    })
  }

  const createdCards = await prisma.$transaction(async (transaction) => {
    await transaction.userCatalogWord.createMany({
      data: nextWords.map((word) => ({
        userId: user.id,
        wordCatalogId: word.id
      }))
    })

    const cards = await Promise.all(
      nextWords.map((word) =>
        transaction.card.create({
          data: {
            userId: user.id,
            catalogWordId: word.id,
            original: word.word,
            translation: word.translation,
            direction: "en-ru",
            example: word.example,
            phonetic: word.phonetic,
            nextReviewDate: today,
            lastReviewResult: "unknown"
          }
        })
      )
    )

    if (cards.length) {
      await transaction.appAnalytics.upsert({
        where: {
          date: today
        },
        update: {
          newCards: {
            increment: cards.length
          }
        },
        create: {
          date: today,
          newCards: cards.length
        }
      })
    }

    return cards
  })

  const nextClaimedToday = claimedToday + createdCards.length

  return NextResponse.json({
    cards: createdCards.map((card) => serializeCard(card)),
    createdCount: createdCards.length,
    claimedToday: nextClaimedToday,
    dailyLimit: settings.dailyNewCardsLimit,
    remainingToday: Math.max(settings.dailyNewCardsLimit - nextClaimedToday, 0),
    limitReached: nextClaimedToday >= settings.dailyNewCardsLimit
  })
}

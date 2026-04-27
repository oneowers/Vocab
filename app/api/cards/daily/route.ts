import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { ensureCatalogWordLocalized, getOrCreateAppSettings } from "@/lib/catalog"
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

  const localizedWords = await Promise.all(
    nextWords.map((word) => ensureCatalogWordLocalized(prisma, word.id))
  )
  const readyWords = localizedWords.filter((word): word is NonNullable<typeof word> => Boolean(word))

  const createdCards = await prisma.$transaction(async (transaction) => {
    await transaction.userCatalogWord.createMany({
      data: readyWords.map((word) => ({
        userId: user.id,
        wordCatalogId: word.id
      }))
    })

    const cards = await Promise.all(
      readyWords.map((word) =>
        transaction.card.create({
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
          include: {
            catalogWord: true
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

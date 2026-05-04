import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getOptionalAuthUser } from "@/lib/auth"
import {
  ensureCatalogWordLocalized,
  findCatalogWordByTranslation,
  findCatalogWordByWord,
  getOrCreateAppSettings
} from "@/lib/catalog"
import { serializedCardSelect } from "@/lib/db-selects"
import { getTodayDateKey } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import { userCacheTag, adminCacheTag } from "@/lib/server-cache"
import { serializeCard } from "@/lib/serializers"
import { getUserCardsPageData } from "@/lib/server-data"

const createCardSchema = z.object({
  original: z.string().min(1, "Original word is required"),
  translation: z.string().min(1, "Translation is required"),
  direction: z.enum(["en-ru", "ru-en"]),
  translationAlternatives: z.array(z.string()).optional(),
  example: z.string().nullable().optional(),
  phonetic: z.string().nullable().optional()
})

export async function GET(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrisma()
  const status = request.nextUrl.searchParams.get("status")
  const search = request.nextUrl.searchParams.get("search")?.trim()
  const due = request.nextUrl.searchParams.get("due")
  const hasCardFilters = status === "known" || status === "unknown" || Boolean(search) || due === "today"

  if (!hasCardFilters) {
    return NextResponse.json(await getUserCardsPageData(user.id))
  }

  const today = getTodayDateKey()
  const todayStart = new Date(`${today}T00:00:00.000Z`)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

  const [cards, totalCards, mastered, settings, claimedToday] = await Promise.all([
    prisma.card.findMany({
      where: {
        userId: user.id,
        ...(status === "known" || status === "unknown"
          ? { lastReviewResult: status }
          : {}),
        ...(search
          ? {
            OR: [
                { original: { contains: search, mode: "insensitive" } },
                { translation: { contains: search, mode: "insensitive" } },
                {
                  catalogWord: {
                    is: {
                      OR: [
                        { word: { contains: search, mode: "insensitive" } },
                        { translation: { contains: search, mode: "insensitive" } }
                      ]
                    }
                  }
                }
              ]
            }
          : {}),
        ...(due === "today" ? { nextReviewDate: { lte: today } } : {})
      },
      select: serializedCardSelect,
      orderBy: [{ nextReviewDate: "asc" }, { dateAdded: "desc" }]
    }),
    prisma.card.count({
      where: {
        userId: user.id
      }
    }),
    prisma.card.count({
      where: {
        userId: user.id,
        reviewCount: {
          gte: 3
        }
      }
    }),
    getOrCreateAppSettings(prisma),
    prisma.userCatalogWord.count({
      where: {
        userId: user.id,
        status: "ACTIVE",
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart
        }
      }
    })
  ])

  const serializedCards = cards.map((card) => serializeCard(card))
  const dailyTarget =
    typeof user.dailyWordTarget === "number" && user.dailyWordTarget > 0 ? user.dailyWordTarget : 10
  const rawDueToday = serializedCards.filter((card) => card.nextReviewDate <= today).length
  const todayCount = Math.min(rawDueToday, dailyTarget)
  const waitingCount = Math.max(totalCards - todayCount, 0)

  return NextResponse.json({
    cards: serializedCards,
    summary: {
      streak: user.streak,
      reviewLives: settings.reviewLives,
      totalCards,
      dueToday: todayCount,
      mastered
    },
    dailyCatalog: {
      dailyTarget,
      todayCount,
      savedCount: totalCards,
      waitingCount,
      claimedToday,
      dailyLimit: settings.dailyNewCardsLimit,
      remainingToday: Math.max(settings.dailyNewCardsLimit - claimedToday, 0),
      cefrLevel: user.cefrLevel
    }
  })
}



export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body;
  try {
    body = createCardSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const original = body.original.trim()
  const translation = body.translation.trim()
  const translationAlternatives = Array.from(
    new Set(
      (body.translationAlternatives ?? [])
        .map((item) => item.trim())
        .filter((item) => item && item !== translation)
    )
  )
  const direction = body.direction

  const prisma = getPrisma()
  const matchingCatalogWord =
    direction === "en-ru"
      ? await findCatalogWordByWord(prisma, original)
      : await findCatalogWordByWord(prisma, translation) ?? await findCatalogWordByTranslation(prisma, original)
  const hydratedCatalogWord =
    matchingCatalogWord ? await ensureCatalogWordLocalized(prisma, matchingCatalogWord.id) : null
  const card = await prisma.card.create({
    data: hydratedCatalogWord
      ? {
          userId: user.id,
          catalogWordId: hydratedCatalogWord.id,
          original: null,
          translation: null,
          direction,
          example: null,
          phonetic: null,
          nextReviewDate: getTodayDateKey(),
          lastReviewResult: "unknown"
        }
      : {
          userId: user.id,
          original,
          translation,
          translationAlternatives,
          direction,
          example: body.example?.trim() || null,
          phonetic: body.phonetic?.trim() || null,
          nextReviewDate: getTodayDateKey(),
          lastReviewResult: "unknown"
        },
    select: serializedCardSelect
  })

  revalidateTag(userCacheTag.cards(user.id))
  revalidateTag(userCacheTag.review(user.id))
  revalidateTag(userCacheTag.stats(user.id))
  revalidateTag(adminCacheTag.analytics)

  await prisma.appAnalytics.upsert({
    where: {
      date: getTodayDateKey()
    },
    update: {
      newCards: {
        increment: 1
      }
    },
    create: {
      date: getTodayDateKey(),
      newCards: 1
    }
  })

  return NextResponse.json({ card: serializeCard(card) }, { status: 201 })
}

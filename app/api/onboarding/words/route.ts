import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { buildOnboardingWordSelection, getOnboardingReplacementWord } from "@/lib/onboarding-words"
import { ensureCatalogWordLocalized } from "@/lib/catalog"
import { serializedCardSelect } from "@/lib/db-selects"
import { getTodayDateKey } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag, userCacheTag } from "@/lib/server-cache"
import type { SerializableCard } from "@/lib/serializers"
import { serializeCard } from "@/lib/serializers"

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.onboardingStep !== "FIRST_WORDS" && !user.onboardingCompletedAt) {
    return NextResponse.json({ error: "Word selection is not available yet." }, { status: 409 })
  }

  const payload = await buildOnboardingWordSelection(getPrisma(), user)
  return NextResponse.json(payload)
}

export async function POST(request: Request) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrisma()
  const body = (await request.json().catch(() => null)) as
    | {
        action?: "replace" | "know" | "start"
        wordId?: string
        wordIds?: string[]
        currentWordIds?: string[]
        preferredLevel?: string
      }
    | null

  const action = body?.action

  if (action === "replace") {
    const currentWordIds = Array.isArray(body?.currentWordIds)
      ? body.currentWordIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : []

    if (typeof body?.wordId !== "string" || typeof body?.preferredLevel !== "string") {
      return NextResponse.json({ error: "Invalid replacement payload." }, { status: 400 })
    }

    const replacement = await getOnboardingReplacementWord(
      prisma,
      user,
      body.preferredLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
      [...currentWordIds, body.wordId]
    )

    return NextResponse.json({ item: replacement })
  }

  if (action === "know") {
    const currentWordIds = Array.isArray(body?.currentWordIds)
      ? body.currentWordIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : []

    if (typeof body?.wordId !== "string" || typeof body?.preferredLevel !== "string") {
      return NextResponse.json({ error: "Invalid know payload." }, { status: 400 })
    }

    await prisma.userCatalogWord.upsert({
      where: {
        userId_wordCatalogId: {
          userId: user.id,
          wordCatalogId: body.wordId
        }
      },
      update: {
        status: "KNOWN"
      },
      create: {
        userId: user.id,
        wordCatalogId: body.wordId,
        status: "KNOWN"
      }
    })

    const replacement = await getOnboardingReplacementWord(
      prisma,
      user,
      body.preferredLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
      currentWordIds.filter((value) => value !== body.wordId)
    )

    return NextResponse.json({ item: replacement })
  }

  if (action === "start") {
    const requestedIds = Array.isArray(body?.wordIds)
      ? Array.from(
          new Set(body.wordIds.filter((value): value is string => typeof value === "string" && value.length > 0))
        )
      : []

    if (!requestedIds.length) {
      return NextResponse.json({ error: "Choose at least one word to start practice." }, { status: 400 })
    }

    const words = await prisma.wordCatalog.findMany({
      where: {
        id: {
          in: requestedIds
        },
        isPublished: true
      },
      select: {
        id: true
      }
    })
    const validIds = words.map((word) => word.id)

    if (!validIds.length) {
      return NextResponse.json({ error: "No valid words were selected." }, { status: 400 })
    }

    const localizedWords = await Promise.all(validIds.map((wordId) => ensureCatalogWordLocalized(prisma, wordId)))
    const readyWords = localizedWords.filter((word): word is NonNullable<typeof word> => Boolean(word))
    const today = getTodayDateKey()

    const transaction = await prisma.$transaction([
      prisma.userCatalogWord.createMany({
        data: readyWords.map((word) => ({
          userId: user.id,
          wordCatalogId: word.id,
          status: "ACTIVE"
        })),
        skipDuplicates: true
      }),
      ...readyWords.map((word) =>
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
      ),
      prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          onboardingStep: "COMPLETED",
          onboardingCompletedAt: new Date()
        },
        select: {
          onboardingCompletedAt: true
        }
      })
    ])

    const createdCards = (transaction.slice(1, transaction.length - 1) as SerializableCard[]).map((card) =>
      serializeCard(card)
    )

    if (createdCards.length) {
      revalidateTag(userCacheTag.cards(user.id))
      revalidateTag(userCacheTag.review(user.id))
      revalidateTag(userCacheTag.stats(user.id))
      revalidateTag(adminCacheTag.analytics)
    }

    return NextResponse.json({
      createdCount: createdCards.length,
      cards: createdCards
    })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

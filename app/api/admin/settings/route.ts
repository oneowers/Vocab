import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { getOrCreateAppSettings, isTranslationEngine, isTranslationProvider } from "@/lib/catalog"
import { getPrisma } from "@/lib/prisma"
import { sharedCacheTag } from "@/lib/server-cache"
import { serializeAppSettings } from "@/lib/serializers"

async function requireAdminUser() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  if (user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return {
    user
  }
}

export async function GET() {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  const settings = await getOrCreateAppSettings(getPrisma())

  return NextResponse.json({
    settings: serializeAppSettings(settings)
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminUser()

    if ("error" in auth) {
      return auth.error
    }

    const body = (await request.json()) as {
      dailyNewCardsLimit?: number
      reviewLives?: number
      cefrProfilerEnabled?: boolean
      translationPriority?: string[]
      grammarCorrectPoints?: number
      grammarPenaltyLow?: number
      grammarPenaltyMedium?: number
      grammarPenaltyHigh?: number
      mobileNavOrder?: string[]
    }

    const currentSettings = await getOrCreateAppSettings(getPrisma())

    const nextDailyNewCardsLimit =
      typeof body.dailyNewCardsLimit === "number"
        ? body.dailyNewCardsLimit
        : currentSettings.dailyNewCardsLimit
    const nextReviewLives =
      typeof body.reviewLives === "number"
        ? body.reviewLives
        : currentSettings.reviewLives
    const nextCefrProfilerEnabled =
      typeof body.cefrProfilerEnabled === "boolean"
        ? body.cefrProfilerEnabled
        : currentSettings.cefrProfilerEnabled
    const nextTranslationPriority = Array.isArray(body.translationPriority)
      ? body.translationPriority
      : currentSettings.translationPriority
    const nextGrammarCorrectPoints = typeof body.grammarCorrectPoints === "number" ? body.grammarCorrectPoints : currentSettings.grammarCorrectPoints
    const nextGrammarPenaltyLow = typeof body.grammarPenaltyLow === "number" ? body.grammarPenaltyLow : currentSettings.grammarPenaltyLow
    const nextGrammarPenaltyMedium = typeof body.grammarPenaltyMedium === "number" ? body.grammarPenaltyMedium : currentSettings.grammarPenaltyMedium
    const nextGrammarPenaltyHigh = typeof body.grammarPenaltyHigh === "number" ? body.grammarPenaltyHigh : currentSettings.grammarPenaltyHigh
    const nextMobileNavOrder = Array.isArray(body.mobileNavOrder) ? body.mobileNavOrder : currentSettings.mobileNavOrder

    if (
      !Number.isInteger(nextDailyNewCardsLimit) ||
      nextDailyNewCardsLimit < 1 ||
      nextDailyNewCardsLimit > 100
    ) {
      return NextResponse.json({ error: "Invalid daily card limit." }, { status: 400 })
    }

    if (
      !Number.isInteger(nextReviewLives) ||
      nextReviewLives < 1 ||
      nextReviewLives > 7
    ) {
      return NextResponse.json({ error: "Invalid hearts value." }, { status: 400 })
    }

    const normalizedPriority = Array.from(new Set(nextTranslationPriority.filter(isTranslationEngine)))

    if (normalizedPriority.length < 1) {
      return NextResponse.json({ error: "Invalid translator priority." }, { status: 400 })
    }

    const nextTranslationProvider =
      normalizedPriority.length === 1 && normalizedPriority[0] === "catalog"
        ? "catalog-only"
        : "auto"

    if (!isTranslationProvider(nextTranslationProvider)) {
      return NextResponse.json({ error: "Invalid translation source." }, { status: 400 })
    }

    const settings = await getPrisma().appSettings.upsert({
      where: {
        id: "app"
      },
      update: {
        dailyNewCardsLimit: nextDailyNewCardsLimit,
        reviewLives: nextReviewLives,
        cefrProfilerEnabled: nextCefrProfilerEnabled,
        translationProvider: nextTranslationProvider,
        translationPriority: normalizedPriority,
        grammarCorrectPoints: nextGrammarCorrectPoints,
        grammarPenaltyLow: nextGrammarPenaltyLow,
        grammarPenaltyMedium: nextGrammarPenaltyMedium,
        grammarPenaltyHigh: nextGrammarPenaltyHigh,
        mobileNavOrder: nextMobileNavOrder
      },
      create: {
        id: "app",
        dailyNewCardsLimit: nextDailyNewCardsLimit,
        reviewLives: nextReviewLives,
        cefrProfilerEnabled: nextCefrProfilerEnabled,
        translationProvider: nextTranslationProvider,
        translationPriority: normalizedPriority,
        grammarCorrectPoints: nextGrammarCorrectPoints,
        grammarPenaltyLow: nextGrammarPenaltyLow,
        grammarPenaltyMedium: nextGrammarPenaltyMedium,
        grammarPenaltyHigh: nextGrammarPenaltyHigh,
        mobileNavOrder: nextMobileNavOrder
      }
    })

    // revalidateTag(sharedCacheTag.appSettings)

    return NextResponse.json({
      settings: serializeAppSettings(settings)
    })
  } catch (err: any) {
    console.error("PATCH /api/admin/settings Error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}


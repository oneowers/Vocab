import { NextRequest, NextResponse } from "next/server"

import type { CefrLevel } from "@prisma/client"

import { getOptionalAuthUser } from "@/lib/auth"
import {
  ensureCatalogWordLocalized,
  findCatalogWordByTranslation,
  findCatalogWordByWord,
  getOrCreateAppSettings,
  resolveTranslationDetails
} from "@/lib/catalog"
import { isGuestModeEnabled } from "@/lib/config"
import { getPrisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/throttle"

type SupportedLanguage = "EN" | "RU"

function getThrottleKey(request: NextRequest, userId: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return userId || forwardedFor || "guest"
}

function parseLangpair(langpair: string) {
  const separator = langpair.includes("/") ? "/" : "|"
  const [source = "", target = ""] = langpair.split(separator)
  const sourceLang = source.slice(0, 2).toUpperCase()
  const targetLang = target.slice(0, 2).toUpperCase()

  if (
    (sourceLang !== "EN" && sourceLang !== "RU") ||
    (targetLang !== "EN" && targetLang !== "RU")
  ) {
    return null
  }

  return {
    sourceLang: sourceLang as SupportedLanguage,
    targetLang: targetLang as SupportedLanguage
  }
}

export async function GET(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user && !isGuestModeEnabled()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const query = request.nextUrl.searchParams.get("q")?.trim()
  const langpair = request.nextUrl.searchParams.get("langpair")?.trim()

  if (!query || !langpair) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 })
  }

  if (isRateLimited(`translate:${getThrottleKey(request, user?.id ?? null)}`)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }

  const parsedLangpair = parseLangpair(langpair)

  if (!parsedLangpair) {
    return NextResponse.json({ error: "Unsupported language pair" }, { status: 400 })
  }

  const { sourceLang, targetLang } = parsedLangpair
  const prisma = getPrisma()
  const settings = await getOrCreateAppSettings(prisma)
  const directCatalogWord =
    sourceLang === "EN" && targetLang === "RU"
      ? await findCatalogWordByWord(prisma, query)
      : sourceLang === "RU" && targetLang === "EN"
        ? await findCatalogWordByTranslation(prisma, query)
        : null
  const localizedDirectCatalogWord =
    directCatalogWord && sourceLang === "EN" && targetLang === "RU"
      ? await ensureCatalogWordLocalized(prisma, directCatalogWord.id)
      : directCatalogWord
  const directCatalogTranslation =
    localizedDirectCatalogWord
      ? sourceLang === "EN" && targetLang === "RU"
        ? localizedDirectCatalogWord.translation.trim()
        : localizedDirectCatalogWord.word.trim()
      : null
  const resolved = await resolveTranslationDetails({
    prisma,
    query,
    sourceLang,
    targetLang
  })

  if (!resolved?.translation) {
    return NextResponse.json(
      { error: "Translation service is unavailable." },
      { status: 502 }
    )
  }

  let cefrLevel: CefrLevel | null =
    resolved.source === "catalog" ? localizedDirectCatalogWord?.cefrLevel ?? null : null

  if (!cefrLevel && sourceLang === "RU" && targetLang === "EN") {
    const resolvedEnglishCatalogWord = await findCatalogWordByWord(
      prisma,
      resolved.translation
    )

    if (resolvedEnglishCatalogWord) {
      const hydratedCatalogWord = await ensureCatalogWordLocalized(
        prisma,
        resolvedEnglishCatalogWord.id
      )

      cefrLevel = hydratedCatalogWord?.cefrLevel ?? resolvedEnglishCatalogWord.cefrLevel
    }
  }

  return NextResponse.json({
    translation: resolved.translation,
    translationAlternatives: resolved.translationAlternatives,
    cefrLevel,
    source: resolved.source,
    cefrProfilerEnabled: settings.cefrProfilerEnabled
  })
}

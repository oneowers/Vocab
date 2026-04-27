import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { resolveTranslation } from "@/lib/catalog"
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
  const translation = await resolveTranslation({
    prisma: getPrisma(),
    query,
    sourceLang,
    targetLang
  })

  if (!translation) {
    return NextResponse.json(
      { error: "Translation service is unavailable." },
      { status: 502 }
    )
  }

  return NextResponse.json({
    translation
  })
}

import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { isGuestModeEnabled } from "@/lib/config"
import { isRateLimited } from "@/lib/throttle"

interface DeepLResponse {
  translations?: Array<{
    text?: string
  }>
}

function getThrottleKey(request: NextRequest, userId: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return userId || forwardedFor || "guest"
}

function parseLangpair(langpair: string) {
  const separator = langpair.includes("/") ? "/" : "|"
  const [source = "", target = ""] = langpair.split(separator)

  return {
    sourceLang: source.slice(0, 2).toUpperCase(),
    targetLang: target.slice(0, 2).toUpperCase()
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

  if (!process.env.DEEPL_API_KEY) {
    return NextResponse.json(
      { error: "Translation service not configured." },
      { status: 500 }
    )
  }

  const { sourceLang, targetLang } = parseLangpair(langpair)

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: [query],
      source_lang: sourceLang,
      target_lang: targetLang
    }),
    cache: "no-store"
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: "Translation service is unavailable." },
      { status: 502 }
    )
  }

  const payload = (await response.json()) as DeepLResponse

  return NextResponse.json({
    translation: payload.translations?.[0]?.text?.trim() || ""
  })
}

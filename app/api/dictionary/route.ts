import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { isGuestModeEnabled } from "@/lib/config"
import { isRateLimited } from "@/lib/throttle"

interface DictionaryEntry {
  phonetic?: string
  phonetics?: Array<{ text?: string }>
  meanings?: Array<{
    definitions?: Array<{
      example?: string
    }>
  }>
}

function getThrottleKey(request: NextRequest, userId: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return userId || forwardedFor || "guest"
}

export async function GET(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user && !isGuestModeEnabled()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const word = request.nextUrl.searchParams.get("word")?.trim()

  if (!word) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 })
  }

  if (isRateLimited(`dictionary:${getThrottleKey(request, user?.id ?? null)}`)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }

  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    {
      cache: "no-store"
    }
  )

  if (!response.ok) {
    return NextResponse.json({
      example: null,
      phonetic: null
    })
  }

  const payload = (await response.json()) as DictionaryEntry[]
  const firstEntry = payload[0]
  const example =
    firstEntry?.meanings
      ?.flatMap((meaning) => meaning.definitions ?? [])
      .find((definition) => typeof definition.example === "string")?.example ?? null
  const phonetic =
    firstEntry?.phonetic ||
    firstEntry?.phonetics?.find((item) => typeof item.text === "string")?.text ||
    null

  return NextResponse.json({
    example,
    phonetic
  })
}


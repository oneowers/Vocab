import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { isGuestModeEnabled } from "@/lib/config"
import { isRateLimited } from "@/lib/throttle"

function getThrottleKey(request: NextRequest, userId: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return userId || forwardedFor || "guest"
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

  const response = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=${encodeURIComponent(langpair)}`,
    {
      cache: "no-store"
    }
  )

  if (!response.ok) {
    return NextResponse.json(
      { error: "Translation service is unavailable." },
      { status: 502 }
    )
  }

  const payload = (await response.json()) as {
    responseData?: {
      translatedText?: string
    }
  }

  return NextResponse.json({
    translation: payload.responseData?.translatedText?.trim() || ""
  })
}


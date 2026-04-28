import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getOrCreateAppSettings } from "@/lib/catalog"
import { isGuestModeEnabled } from "@/lib/config"
import { fetchCefrProfile } from "@/lib/cefr-profile"
import { getPrisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/throttle"

type CefrProfileRequestBody = {
  text?: string
}

function getThrottleKey(request: NextRequest, userId: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return userId || forwardedFor || "guest"
}

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user && !isGuestModeEnabled()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isRateLimited(`cefr-profile:${getThrottleKey(request, user?.id ?? null)}`)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }

  const settings = await getOrCreateAppSettings(getPrisma())

  if (!settings.cefrProfilerEnabled) {
    return NextResponse.json({ error: "CEFR profiler is disabled." }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as CefrProfileRequestBody | null
  const text = body?.text?.trim()

  if (!text) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 })
  }

  const profile = await fetchCefrProfile(text)

  if (!profile) {
    return NextResponse.json({ error: "CEFR profiler is unavailable." }, { status: 502 })
  }

  return NextResponse.json(profile)
}

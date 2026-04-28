import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { findCatalogWordByWord } from "@/lib/catalog"
import { fetchDictionaryDetails } from "@/lib/dictionary"
import { getPrisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/throttle"

function getThrottleKey(request: NextRequest, userId: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return userId || forwardedFor || "guest"
}

export async function GET(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const word = request.nextUrl.searchParams.get("word")?.trim()

  if (!word) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 })
  }

  if (isRateLimited(`dictionary:${getThrottleKey(request, user?.id ?? null)}`)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }

  const dictionary = await fetchDictionaryDetails(word)
  const prisma = getPrisma()
  const synonyms = await Promise.all(
    dictionary.synonyms.map(async (synonym) => {
      const catalogWord = await findCatalogWordByWord(prisma, synonym)

      return {
        word: synonym,
        cefrLevel: catalogWord?.cefrLevel ?? null
      }
    })
  )

  return NextResponse.json({
    ...dictionary,
    synonyms
  })
}

import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getTodayDateKey, isDueDate } from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import { serializeCard } from "@/lib/serializers"
import { buildDashboardSummary } from "@/lib/server-data"

export async function GET(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrisma()
  const status = request.nextUrl.searchParams.get("status")
  const search = request.nextUrl.searchParams.get("search")?.trim()
  const due = request.nextUrl.searchParams.get("due")
  const today = getTodayDateKey()

  const cards = await prisma.card.findMany({
    where: {
      userId: user.id,
      ...(status === "known" || status === "unknown"
        ? { lastReviewResult: status }
        : {}),
      ...(search
        ? {
            OR: [
              { original: { contains: search, mode: "insensitive" } },
              { translation: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(due === "today" ? { nextReviewDate: { lte: today } } : {})
    },
    orderBy: [{ nextReviewDate: "asc" }, { dateAdded: "desc" }]
  })

  const allCards = await prisma.card.findMany({
    where: {
      userId: user.id
    },
    orderBy: [{ nextReviewDate: "asc" }, { dateAdded: "desc" }]
  })

  const serializedCards = cards.map((card) => serializeCard(card))
  const summary = buildDashboardSummary(
    allCards.map((card) => serializeCard(card)),
    user.streak
  )

  return NextResponse.json({
    cards: serializedCards,
    summary: {
      ...summary,
      dueToday: allCards.filter((card) => isDueDate(card.nextReviewDate, today)).length
    }
  })
}

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    original?: string
    translation?: string
    direction?: "en-ru" | "ru-en"
    example?: string | null
    phonetic?: string | null
  }

  const original = body.original?.trim()
  const translation = body.translation?.trim()
  const direction = body.direction

  if (!original || !translation || !direction) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const prisma = getPrisma()
  const card = await prisma.card.create({
    data: {
      userId: user.id,
      original,
      translation,
      direction,
      example: body.example?.trim() || null,
      phonetic: body.phonetic?.trim() || null,
      nextReviewDate: getTodayDateKey(),
      lastReviewResult: "unknown"
    }
  })

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

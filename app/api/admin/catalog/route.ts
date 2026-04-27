import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { isCefrLevel, resolveTranslation } from "@/lib/catalog"
import { getPrisma } from "@/lib/prisma"
import { serializeWordCatalog } from "@/lib/serializers"

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

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  const page = Math.max(Number(request.nextUrl.searchParams.get("page") || "1"), 1)
  const search = request.nextUrl.searchParams.get("search")?.trim()
  const cefrLevel = request.nextUrl.searchParams.get("cefrLevel")?.trim().toUpperCase()
  const topic = request.nextUrl.searchParams.get("topic")?.trim()
  const published = request.nextUrl.searchParams.get("published")?.trim()
  const pageSize = 50
  const prisma = getPrisma()

  const where = {
    ...(search
      ? {
          OR: [
            { word: { contains: search, mode: "insensitive" as const } },
            { translation: { contains: search, mode: "insensitive" as const } },
            { topic: { contains: search, mode: "insensitive" as const } },
            { partOfSpeech: { contains: search, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(cefrLevel && isCefrLevel(cefrLevel) ? { cefrLevel } : {}),
    ...(topic ? { topic: { contains: topic, mode: "insensitive" as const } } : {}),
    ...(published === "published"
      ? { isPublished: true }
      : published === "draft"
        ? { isPublished: false }
        : {})
  }

  const [totalItems, items] = await Promise.all([
    prisma.wordCatalog.count({ where }),
    prisma.wordCatalog.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  return NextResponse.json({
    items: items.map((item) => serializeWordCatalog(item)),
    page,
    totalPages: Math.max(Math.ceil(totalItems / pageSize), 1),
    totalItems
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  const body = (await request.json()) as {
    word?: string
    translation?: string
    cefrLevel?: string
    partOfSpeech?: string
    topic?: string
    example?: string
    phonetic?: string
    priority?: number
    isPublished?: boolean
  }

  const prisma = getPrisma()
  const word = body.word?.trim()
  const cefrLevel = body.cefrLevel?.trim().toUpperCase()
  const partOfSpeech = body.partOfSpeech?.trim()
  const topic = body.topic?.trim()
  const example = body.example?.trim()
  const phonetic = body.phonetic?.trim()
  const translation =
    body.translation?.trim() ||
    (word
      ? await resolveTranslation({
          prisma,
          query: word,
          sourceLang: "EN",
          targetLang: "RU"
        })
      : null)
  const priority =
    typeof body.priority === "number" && Number.isInteger(body.priority) ? body.priority : 0

  if (
    !word ||
    !translation ||
    !cefrLevel ||
    !partOfSpeech ||
    !topic ||
    !example ||
    !phonetic ||
    !isCefrLevel(cefrLevel)
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existingWord = await prisma.wordCatalog.findFirst({
    where: {
      word: {
        equals: word,
        mode: "insensitive"
      }
    }
  })

  if (existingWord) {
    return NextResponse.json(
      { error: "This word already exists in the catalog." },
      { status: 409 }
    )
  }

  const created = await prisma.wordCatalog.create({
    data: {
      word,
      translation,
      cefrLevel,
      partOfSpeech,
      topic,
      example,
      phonetic,
      priority,
      isPublished: body.isPublished === true
    }
  })

  return NextResponse.json({ item: serializeWordCatalog(created) }, { status: 201 })
}

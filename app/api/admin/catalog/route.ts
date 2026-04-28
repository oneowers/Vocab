import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { isCefrLevel, resolveTranslationDetails } from "@/lib/catalog"
import { canPublishCatalogWord, getCatalogReviewStatus } from "@/lib/cefr-seed"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag, cacheAdminResource } from "@/lib/server-cache"
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

interface CatalogFilters {
  page: number
  pageSize: number
  search?: string
  cefrLevel?: string
  topic?: string
  published?: string
  enrichmentStatus?: "pending" | "completed" | "failed"
  reviewStatus?: "draft" | "approved"
}

function normalizeFilters(request: NextRequest): CatalogFilters {
  const page = Math.max(Number(request.nextUrl.searchParams.get("page") || "1"), 1)
  const search = request.nextUrl.searchParams.get("search")?.trim() || undefined
  const cefrLevel = request.nextUrl.searchParams.get("cefrLevel")?.trim().toUpperCase() || undefined
  const topic = request.nextUrl.searchParams.get("topic")?.trim() || undefined
  const published = request.nextUrl.searchParams.get("published")?.trim() || undefined
  const enrichmentStatus = request.nextUrl.searchParams.get("enrichmentStatus")?.trim()
  const reviewStatus = request.nextUrl.searchParams.get("reviewStatus")?.trim()

  return {
    page,
    pageSize: 50,
    search,
    cefrLevel,
    topic,
    published,
    enrichmentStatus:
      enrichmentStatus === "pending" || enrichmentStatus === "completed" || enrichmentStatus === "failed"
        ? enrichmentStatus
        : undefined,
    reviewStatus:
      reviewStatus === "draft" || reviewStatus === "approved" ? reviewStatus : undefined
  }
}

function buildWhere(filters: CatalogFilters): Prisma.WordCatalogWhereInput {
  return {
    ...(filters.cefrLevel && isCefrLevel(filters.cefrLevel) ? { cefrLevel: filters.cefrLevel } : {}),
    ...(filters.topic ? { topic: { contains: filters.topic, mode: "insensitive" as const } } : {}),
    ...(filters.published === "published"
      ? { isPublished: true }
      : filters.published === "draft"
        ? { isPublished: false }
        : {}),
    ...(filters.enrichmentStatus ? { enrichmentStatus: filters.enrichmentStatus } : {}),
    ...(filters.reviewStatus ? { reviewStatus: filters.reviewStatus } : {})
  }
}

type RawWordCatalogRow = {
  id: string
  word: string
  translation: string
  translationAlternatives: string[]
  cefrLevel: string
  partOfSpeech: string
  topic: string
  example: string
  phonetic: string
  priority: number
  isPublished: boolean
  source: string | null
  sourceRef: string | null
  enrichmentStatus: string
  reviewStatus: string
  lastEnrichedAt: Date | null
  enrichmentError: string | null
  createdAt: Date
  updatedAt: Date
}

async function getCatalogPayload(filters: CatalogFilters) {
  const prisma = getPrisma()
  const where = buildWhere(filters)
  const skip = (filters.page - 1) * filters.pageSize

  if (!filters.search) {
    const [totalItems, items] = await Promise.all([
      prisma.wordCatalog.count({ where }),
      prisma.wordCatalog.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        skip,
        take: filters.pageSize
      })
    ])

    return {
      items: items.map((item) => serializeWordCatalog(item)),
      page: filters.page,
      totalPages: Math.max(Math.ceil(totalItems / filters.pageSize), 1),
      totalItems
    }
  }

  const conditions: Prisma.Sql[] = [
    Prisma.sql`"search_vector" @@ websearch_to_tsquery('simple', ${filters.search})`
  ]

  if (filters.cefrLevel && isCefrLevel(filters.cefrLevel)) {
    conditions.push(Prisma.sql`"cefrLevel" = ${filters.cefrLevel}`)
  }

  if (filters.topic) {
    conditions.push(Prisma.sql`"topic" ILIKE ${`%${filters.topic}%`}`)
  }

  if (filters.published === "published") {
    conditions.push(Prisma.sql`"isPublished" = true`)
  } else if (filters.published === "draft") {
    conditions.push(Prisma.sql`"isPublished" = false`)
  }

  if (filters.enrichmentStatus) {
    conditions.push(Prisma.sql`"enrichmentStatus" = ${filters.enrichmentStatus}`)
  }

  if (filters.reviewStatus) {
    conditions.push(Prisma.sql`"reviewStatus" = ${filters.reviewStatus}`)
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`

  const [countRows, items] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "WordCatalog"
      ${whereClause}
    `),
    prisma.$queryRaw<RawWordCatalogRow[]>(Prisma.sql`
      SELECT
        "id",
        "word",
        "translation",
        "translationAlternatives",
        "cefrLevel",
        "partOfSpeech",
        "topic",
        "example",
        "phonetic",
        "priority",
        "isPublished",
        "source",
        "sourceRef",
        "enrichmentStatus",
        "reviewStatus",
        "lastEnrichedAt",
        "enrichmentError",
        "createdAt",
        "updatedAt"
      FROM "WordCatalog"
      ${whereClause}
      ORDER BY "priority" DESC, "createdAt" ASC
      OFFSET ${skip}
      LIMIT ${filters.pageSize}
    `)
  ])

  const totalItems = Number(countRows[0]?.count ?? 0n)

  return {
    items: items.map((item) =>
      serializeWordCatalog({
        ...item,
        cefrLevel: item.cefrLevel as never,
        enrichmentStatus: item.enrichmentStatus as never,
        reviewStatus: item.reviewStatus as never
      })
    ),
    page: filters.page,
    totalPages: Math.max(Math.ceil(totalItems / filters.pageSize), 1),
    totalItems
  }
}

function getCachedCatalogPayload(filters: CatalogFilters) {
  return cacheAdminResource(
    [
      "admin-catalog",
      String(filters.page),
      filters.search ?? "",
      filters.cefrLevel ?? "",
      filters.topic ?? "",
      filters.published ?? "",
      filters.enrichmentStatus ?? "",
      filters.reviewStatus ?? ""
    ],
    [adminCacheTag.catalog],
    () => getCatalogPayload(filters)
  )
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  return NextResponse.json(await getCachedCatalogPayload(normalizeFilters(request)))
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
  const resolvedTranslation =
    !body.translation?.trim() && word
      ? await resolveTranslationDetails({
          prisma,
          query: word,
          sourceLang: "EN",
          targetLang: "RU"
        })
      : null
  const translation = body.translation?.trim() || resolvedTranslation?.translation || null
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

  const completedEntry = {
    translation,
    example,
    phonetic,
    enrichmentStatus: "completed" as const
  }
  const canPublish = canPublishCatalogWord(completedEntry)

  if (body.isPublished === true && !canPublish) {
    return NextResponse.json(
      { error: "This word is missing required details and cannot be published yet." },
      { status: 400 }
    )
  }

  const created = await prisma.wordCatalog.create({
    data: {
      word,
      translation,
      translationAlternatives: resolvedTranslation?.translationAlternatives ?? [],
      cefrLevel,
      partOfSpeech,
      topic,
      example,
      phonetic,
      priority,
      isPublished: body.isPublished === true,
      enrichmentStatus: "completed",
      reviewStatus: getCatalogReviewStatus(body.isPublished === true),
      lastEnrichedAt: new Date(),
      enrichmentError: null
    }
  })

  revalidateTag(adminCacheTag.catalog)

  return NextResponse.json({ item: serializeWordCatalog(created) }, { status: 201 })
}

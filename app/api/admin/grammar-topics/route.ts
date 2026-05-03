import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { isCefrLevel } from "@/lib/catalog"
import { isValidGrammarTopicKey, normalizeGrammarTopicKey } from "@/lib/grammar"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag, cacheAdminResource } from "@/lib/server-cache"
import { serializeGrammarTopic } from "@/lib/serializers"

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

interface GrammarTopicFilters {
  page: number
  pageSize: number
  search?: string
  active?: "all" | "active" | "inactive"
}

function normalizeFilters(request: NextRequest): GrammarTopicFilters {
  const page = Math.max(Number(request.nextUrl.searchParams.get("page") || "1"), 1)
  const search = request.nextUrl.searchParams.get("search")?.trim() || undefined
  const activeParam = request.nextUrl.searchParams.get("active")?.trim()
  const active =
    activeParam === "active" || activeParam === "inactive" || activeParam === "all"
      ? activeParam
      : "all"

  return {
    page,
    pageSize: 50,
    search,
    active
  }
}

function parseExamples(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildWhere(filters: GrammarTopicFilters): Prisma.GrammarTopicWhereInput {
  return {
    ...(filters.active === "active"
      ? { isActive: true }
      : filters.active === "inactive"
        ? { isActive: false }
        : {}),
    ...(filters.search
      ? {
          OR: [
            { key: { contains: filters.search, mode: "insensitive" as const } },
            { titleEn: { contains: filters.search, mode: "insensitive" as const } },
            { titleRu: { contains: filters.search, mode: "insensitive" as const } },
            { category: { contains: filters.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  }
}

async function getGrammarTopicsPayload(filters: GrammarTopicFilters) {
  const prisma = getPrisma()
  const where = buildWhere(filters)
  const [totalItems, items] = await Promise.all([
    prisma.grammarTopic.count({ where }),
    prisma.grammarTopic.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { cefrLevel: "asc" }, { category: "asc" }, { titleEn: "asc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize
    })
  ])

  return {
    items: items.map((item) => serializeGrammarTopic(item)),
    page: filters.page,
    totalPages: Math.max(Math.ceil(totalItems / filters.pageSize), 1),
    totalItems
  }
}

function getCachedGrammarTopicsPayload(filters: GrammarTopicFilters) {
  return cacheAdminResource(
    [
      "admin-grammar-topics",
      String(filters.page),
      filters.search ?? "",
      filters.active ?? "all"
    ],
    [adminCacheTag.grammarTopics],
    () => getGrammarTopicsPayload(filters)
  )
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  return NextResponse.json(await getCachedGrammarTopicsPayload(normalizeFilters(request)))
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  const body = (await request.json().catch(() => null)) as
    | {
        key?: string
        titleEn?: string
        titleRu?: string
        category?: string
        cefrLevel?: string
        description?: string
        formulas?: any
        usage?: any
        examples?: any
        commonMistakes?: any
        exercises?: any
        isActive?: boolean
      }
    | null

  const key = typeof body?.key === "string" ? normalizeGrammarTopicKey(body.key) : ""
  const titleEn = typeof body?.titleEn === "string" ? body.titleEn.trim() : ""
  const titleRu = typeof body?.titleRu === "string" ? body.titleRu.trim() : ""
  const category = typeof body?.category === "string" ? body.category.trim() : ""
  const cefrLevel = typeof body?.cefrLevel === "string" ? body.cefrLevel.trim().toUpperCase() : ""
  const description = typeof body?.description === "string" ? body.description.trim() : ""
  const examples = body?.examples ?? []
  const formulas = body?.formulas ?? null
  const usage = body?.usage ?? null
  const commonMistakes = body?.commonMistakes ?? null
  const exercises = body?.exercises ?? null

  if (
    !key ||
    !isValidGrammarTopicKey(key) ||
    !titleEn ||
    !titleRu ||
    !category ||
    !isCefrLevel(cefrLevel) ||
    !description
  ) {
    return NextResponse.json({ error: "Missing or invalid grammar topic fields." }, { status: 400 })
  }

  const prisma = getPrisma()
  const existing = await prisma.grammarTopic.findUnique({
    where: {
      key
    }
  })

  if (existing) {
    return NextResponse.json(
      { error: "This grammar topic key already exists." },
      { status: 409 }
    )
  }

  const created = await prisma.grammarTopic.create({
    data: {
      key,
      titleEn,
      titleRu,
      category,
      cefrLevel,
      description,
      formulas: formulas as any,
      usage: usage as any,
      examples: examples as any,
      commonMistakes: commonMistakes as any,
      exercises: exercises as any,
      isActive: body?.isActive !== false
    }
  })

  revalidateTag(adminCacheTag.grammarTopics)

  return NextResponse.json({ item: serializeGrammarTopic(created) }, { status: 201 })
}

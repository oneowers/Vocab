import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import type { Prisma } from "@prisma/client"

import { getOptionalAuthUser } from "@/lib/auth"
import { isCefrLevel } from "@/lib/catalog"
import { isValidGrammarTopicKey, normalizeGrammarTopicKey } from "@/lib/grammar"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag } from "@/lib/server-cache"
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

function parseExamples(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: {
      id: string
    }
  }
) {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  const prisma = getPrisma()
  const existing = await prisma.grammarTopic.findUnique({
    where: {
      id: context.params.id
    }
  })

  if (!existing) {
    return NextResponse.json({ error: "Grammar topic not found." }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as
    | {
        key?: string
        titleEn?: string
        titleRu?: string
        category?: string
        cefrLevel?: string
        description?: string
        examples?: unknown
        isActive?: boolean
      }
    | null

  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }

  const key = typeof body.key === "string" ? normalizeGrammarTopicKey(body.key) : existing.key
  const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() : existing.titleEn
  const titleRu = typeof body.titleRu === "string" ? body.titleRu.trim() : existing.titleRu
  const category = typeof body.category === "string" ? body.category.trim() : existing.category
  const cefrLevel =
    typeof body.cefrLevel === "string" ? body.cefrLevel.trim().toUpperCase() : existing.cefrLevel
  const description =
    typeof body.description === "string" ? body.description.trim() : existing.description
  const examples = body.examples === undefined ? existing.examples : parseExamples(body.examples)
  const isActive = typeof body.isActive === "boolean" ? body.isActive : existing.isActive

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

  const duplicate = await prisma.grammarTopic.findFirst({
    where: {
      id: {
        not: existing.id
      },
      key
    }
  })

  if (duplicate) {
    return NextResponse.json(
      { error: "This grammar topic key already exists." },
      { status: 409 }
    )
  }

  const updated = await prisma.grammarTopic.update({
    where: {
      id: existing.id
    },
    data: {
      key,
      titleEn,
      titleRu,
      category,
      cefrLevel,
      description,
      examples: examples as Prisma.InputJsonValue,
      isActive
    }
  })

  revalidateTag(adminCacheTag.grammarTopics)

  return NextResponse.json({ item: serializeGrammarTopic(updated) })
}

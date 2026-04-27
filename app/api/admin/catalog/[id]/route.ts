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
  const existing = await prisma.wordCatalog.findUnique({
    where: {
      id: context.params.id
    }
  })

  if (!existing) {
    return NextResponse.json({ error: "Catalog word not found" }, { status: 404 })
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

  const word = body.word?.trim() ?? existing.word
  const cefrLevel = body.cefrLevel?.trim().toUpperCase() ?? existing.cefrLevel
  const partOfSpeech = body.partOfSpeech?.trim() ?? existing.partOfSpeech
  const topic = body.topic?.trim() ?? existing.topic
  const example = body.example?.trim() ?? existing.example
  const phonetic = body.phonetic?.trim() ?? existing.phonetic
  const translation =
    body.translation !== undefined
      ? body.translation.trim() ||
        (await resolveTranslation({
          prisma,
          query: word,
          sourceLang: "EN",
          targetLang: "RU"
        }))
      : existing.translation
  const priority =
    typeof body.priority === "number" && Number.isInteger(body.priority)
      ? body.priority
      : existing.priority
  const isPublished =
    typeof body.isPublished === "boolean" ? body.isPublished : existing.isPublished

  if (!word || !translation || !partOfSpeech || !topic || !example || !phonetic || !isCefrLevel(cefrLevel)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const duplicate = await prisma.wordCatalog.findFirst({
    where: {
      id: {
        not: existing.id
      },
      word: {
        equals: word,
        mode: "insensitive"
      }
    }
  })

  if (duplicate) {
    return NextResponse.json(
      { error: "This word already exists in the catalog." },
      { status: 409 }
    )
  }

  const updated = await prisma.wordCatalog.update({
    where: {
      id: existing.id
    },
    data: {
      word,
      translation,
      cefrLevel,
      partOfSpeech,
      topic,
      example,
      phonetic,
      priority,
      isPublished
    }
  })

  return NextResponse.json({ item: serializeWordCatalog(updated) })
}

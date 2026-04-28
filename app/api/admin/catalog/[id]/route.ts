import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { isCefrLevel, resolveTranslationDetails } from "@/lib/catalog"
import { canPublishCatalogWord, getCatalogReviewStatus } from "@/lib/cefr-seed"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag } from "@/lib/server-cache"
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
    enrichmentStatus?: "pending" | "completed" | "failed"
    reviewStatus?: "draft" | "approved"
  }

  const word = body.word?.trim() ?? existing.word
  const cefrLevel = body.cefrLevel?.trim().toUpperCase() ?? existing.cefrLevel
  const partOfSpeech = body.partOfSpeech?.trim() ?? existing.partOfSpeech
  const topic = body.topic?.trim() ?? existing.topic
  const example = body.example?.trim() ?? existing.example
  const phonetic = body.phonetic?.trim() ?? existing.phonetic
  const resolvedTranslation =
    body.translation !== undefined && !body.translation.trim()
      ? await resolveTranslationDetails({
          prisma,
          query: word,
          sourceLang: "EN",
          targetLang: "RU"
        })
      : null
  const translation =
    body.translation !== undefined
      ? body.translation.trim() || resolvedTranslation?.translation
      : existing.translation
  const translationForSave = translation ?? existing.translation ?? ""
  const exampleForSave = example ?? ""
  const phoneticForSave = phonetic ?? ""
  const priority =
    typeof body.priority === "number" && Number.isInteger(body.priority)
      ? body.priority
      : existing.priority
  const enrichmentStatus =
    body.enrichmentStatus === "pending" || body.enrichmentStatus === "completed" || body.enrichmentStatus === "failed"
      ? body.enrichmentStatus
      : existing.enrichmentStatus
  const requestedPublished =
    typeof body.isPublished === "boolean" ? body.isPublished : existing.isPublished

  if (!word || !partOfSpeech || !topic || !isCefrLevel(cefrLevel)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (
    requestedPublished &&
    !canPublishCatalogWord({
      translation: translationForSave,
      example: exampleForSave,
      phonetic: phoneticForSave,
      enrichmentStatus
    })
  ) {
    return NextResponse.json(
      { error: "Only completed words with translation, example, and phonetic can be published." },
      { status: 400 }
    )
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
      translation: translationForSave,
      translationAlternatives:
        resolvedTranslation?.translationAlternatives ?? existing.translationAlternatives,
      cefrLevel,
      partOfSpeech,
      topic,
      example: exampleForSave,
      phonetic: phoneticForSave,
      priority,
      isPublished: requestedPublished,
      enrichmentStatus,
      reviewStatus:
        body.reviewStatus === "draft" || body.reviewStatus === "approved"
          ? body.reviewStatus
          : getCatalogReviewStatus(requestedPublished),
      enrichmentError:
        enrichmentStatus === "failed"
          ? existing.enrichmentError || "Requires manual completion."
          : null,
      lastEnrichedAt:
        enrichmentStatus === "completed" ? existing.lastEnrichedAt ?? new Date() : existing.lastEnrichedAt
    }
  })

  revalidateTag(adminCacheTag.catalog)

  return NextResponse.json({ item: serializeWordCatalog(updated) })
}

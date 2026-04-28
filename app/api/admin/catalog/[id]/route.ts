import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { ensureCatalogWordLocalized, isCefrLevel, resolveTranslationDetails } from "@/lib/catalog"
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

function getMissingPublishFields(word: {
  word: string
  translation: string
  partOfSpeech: string
  topic: string
  example: string
  phonetic: string
  enrichmentStatus: string
}) {
  const missingFields: string[] = []

  if (!word.word.trim()) missingFields.push("word")
  if (!word.translation.trim()) missingFields.push("translation")
  if (!word.partOfSpeech.trim()) missingFields.push("partOfSpeech")
  if (!word.topic.trim()) missingFields.push("topic")
  if (!word.example.trim()) missingFields.push("example")
  if (!word.phonetic.trim()) missingFields.push("phonetic")
  if (word.enrichmentStatus !== "completed") missingFields.push("enrichmentStatus")

  return missingFields
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
    enrichmentError?: string | null
    reviewStatus?: "draft" | "approved"
  }

  const wantsToPublish = body.isPublished === true && !existing.isPublished
  const enrichedExisting = wantsToPublish
    ? await ensureCatalogWordLocalized(prisma, existing.id)
    : existing
  const sourceWord = enrichedExisting ?? existing

  const word = body.word?.trim() ?? sourceWord.word
  const cefrLevel = body.cefrLevel?.trim().toUpperCase() ?? existing.cefrLevel
  const partOfSpeech = body.partOfSpeech?.trim() ?? sourceWord.partOfSpeech
  const topic = body.topic?.trim() ?? sourceWord.topic
  const example = body.example?.trim() ?? sourceWord.example
  const phonetic = body.phonetic?.trim() ?? sourceWord.phonetic
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
      : sourceWord.translation
  const translationForSave = translation ?? sourceWord.translation ?? ""
  const exampleForSave = example ?? ""
  const phoneticForSave = phonetic ?? ""
  const priority =
    typeof body.priority === "number" && Number.isInteger(body.priority)
      ? body.priority
      : sourceWord.priority
  const hasPublishableContent =
    Boolean(translationForSave.trim()) &&
    Boolean(exampleForSave.trim()) &&
    Boolean(phoneticForSave.trim())
  const enrichmentStatus =
    body.enrichmentStatus === "pending" || body.enrichmentStatus === "completed" || body.enrichmentStatus === "failed"
      ? body.enrichmentStatus
      : hasPublishableContent
        ? "completed"
      : sourceWord.enrichmentStatus
  const requestedPublished =
    typeof body.isPublished === "boolean" ? body.isPublished : existing.isPublished

  if (!isCefrLevel(cefrLevel)) {
    return NextResponse.json({ error: "Missing fields: cefrLevel" }, { status: 400 })
  }

  const missingPublishFields = requestedPublished
    ? getMissingPublishFields({
        word,
        translation: translationForSave,
        partOfSpeech,
        topic,
        example: exampleForSave,
        phonetic: phoneticForSave,
        enrichmentStatus
      })
    : []

  if (!requestedPublished && (!word || !partOfSpeech || !topic)) {
    const missingFields = [
      !word ? "word" : null,
      !partOfSpeech ? "partOfSpeech" : null,
      !topic ? "topic" : null
    ].filter(Boolean)

    return NextResponse.json(
      { error: `Missing fields: ${missingFields.join(", ")}` },
      { status: 400 }
    )
  }

  if (requestedPublished && missingPublishFields.length) {
    return NextResponse.json(
      { error: `Missing fields: ${missingPublishFields.join(", ")}` },
      { status: 400 }
    )
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
      translationAlternatives:
        resolvedTranslation?.translationAlternatives ?? sourceWord.translationAlternatives,
      enrichmentError:
        enrichmentStatus === "failed"
          ? body.enrichmentError?.trim() || sourceWord.enrichmentError || "Requires manual completion."
          : null,
      lastEnrichedAt:
        enrichmentStatus === "completed" ? sourceWord.lastEnrichedAt ?? new Date() : sourceWord.lastEnrichedAt
    }
  })

  revalidateTag(adminCacheTag.catalog)

  return NextResponse.json({ item: serializeWordCatalog(updated) })
}

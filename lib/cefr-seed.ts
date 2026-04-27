import type { CatalogEnrichmentStatus, CatalogReviewStatus, CefrLevel, PrismaClient, WordCatalog } from "@prisma/client"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { fetchDictionaryDetails } from "./dictionary.ts"
import { resolveTranslationDetails, isCefrLevel } from "./catalog.ts"
import type { EnrichmentResult, ImportedDatasetWord } from "./types.ts"

const execFileAsync = promisify(execFile)

export const WORDS_CEFR_DATASET_SOURCE = "words-cefr-dataset"

interface ImportSeedWordsOptions {
  prisma: PrismaClient
  sqlitePath: string
  levels: CefrLevel[]
}

interface EnrichSeedWordsOptions {
  prisma: PrismaClient
  limit: number
}

interface SeedReport {
  imported: number
  enriched: number
  failed: number
  published: number
  byLevel: Record<CefrLevel, number>
}

function normalizeWord(value: string) {
  return value.trim().toLowerCase()
}

function normalizePartOfSpeech(value: string) {
  return value.trim().toLowerCase()
}

function buildLevelSql(levels: CefrLevel[]) {
  const levelMap: Record<CefrLevel, number> = {
    A1: 1,
    A2: 2,
    B1: 3,
    B2: 4,
    C1: 5,
    C2: 6
  }

  return levels.map((level) => String(levelMap[level])).join(", ")
}

function getCefrSortRank(level: CefrLevel, levels: CefrLevel[]) {
  const index = levels.indexOf(level)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

async function readDatasetWords(sqlitePath: string, levels: CefrLevel[]) {
  const query = `
    SELECT
      wp.word_pos_id AS sourceId,
      w.word AS word,
      p.tag AS partOfSpeech,
      CAST(wp.level AS INTEGER) AS cefrLevel,
      COALESCE(wp.frequency_count, 0) AS priority
    FROM words w
    INNER JOIN word_pos wp ON wp.word_id = w.word_id
    LEFT JOIN pos_tags p ON p.tag_id = wp.pos_tag_id
    WHERE CAST(wp.level AS INTEGER) IN (${buildLevelSql(levels)})
    ORDER BY wp.frequency_count DESC, w.word ASC;
  `

  const { stdout } = await execFileAsync("/usr/bin/sqlite3", ["-json", sqlitePath, query], {
    maxBuffer: 1024 * 1024 * 50
  })

  const rows = JSON.parse(stdout || "[]") as Array<{
    sourceId: string | number
    word: string
    cefrLevel: string | number
    partOfSpeech: string | null
    priority: number | string | null
  }>

  return rows
    .map((row, index, collection) => {
      const numericLevel = Number(row.cefrLevel)
      const cefrLevel =
        numericLevel === 1
          ? "A1"
          : numericLevel === 2
            ? "A2"
            : numericLevel === 3
              ? "B1"
              : numericLevel === 4
                ? "B2"
                : numericLevel === 5
                  ? "C1"
                  : numericLevel === 6
                    ? "C2"
                    : null

      return {
        ...row,
        cefrLevel,
        priority: collection.length - index
      }
    })
    .filter((row) => row.word && row.cefrLevel && isCefrLevel(row.cefrLevel))
    .map<ImportedDatasetWord>((row) => ({
      sourceId: String(row.sourceId),
      word: normalizeWord(row.word),
      cefrLevel: row.cefrLevel as CefrLevel,
      partOfSpeech: normalizePartOfSpeech(row.partOfSpeech || "unknown"),
      priority: Number(row.priority || 0)
    }))
    .sort((left, right) => {
      const levelDifference =
        getCefrSortRank(left.cefrLevel, levels) - getCefrSortRank(right.cefrLevel, levels)

      if (levelDifference !== 0) {
        return levelDifference
      }

      if (left.priority !== right.priority) {
        return right.priority - left.priority
      }

      return left.word.localeCompare(right.word)
    })
}

export async function importSeedWords({
  prisma,
  sqlitePath,
  levels
}: ImportSeedWordsOptions) {
  const datasetWords = await readDatasetWords(sqlitePath, levels)

  if (!datasetWords.length) {
    return {
      imported: 0,
      totalRead: 0
    }
  }

  const existing = await prisma.wordCatalog.findMany({
    select: {
      id: true,
      word: true,
      source: true,
      sourceRef: true,
      isPublished: true,
      reviewStatus: true
    }
  })
  const existingSourceMap = new Map(
    existing
      .filter((item) => item.source === WORDS_CEFR_DATASET_SOURCE && item.sourceRef)
      .map((item) => [item.sourceRef as string, item])
  )
  const existingWords = new Set(existing.map((item) => normalizeWord(item.word)))
  const pendingUpdates = datasetWords
    .filter((item) => {
      const existingBySource = existingSourceMap.get(item.sourceId)
      return Boolean(existingBySource && !existingBySource.isPublished && existingBySource.reviewStatus !== "approved")
    })
  const pendingCreates = datasetWords.filter((item) => {
    if (existingSourceMap.has(item.sourceId)) {
      return false
    }

    return !existingWords.has(item.word)
  })

  for (const item of pendingUpdates) {
    const existingBySource = existingSourceMap.get(item.sourceId)

    if (!existingBySource) {
      continue
    }

    await prisma.wordCatalog.update({
      where: {
        id: existingBySource.id
      },
      data: {
        word: item.word,
        cefrLevel: item.cefrLevel,
        partOfSpeech: item.partOfSpeech,
        priority: item.priority
      }
    })
  }

  const batchSize = 500
  let imported = 0

  for (let index = 0; index < pendingCreates.length; index += batchSize) {
    const batch = pendingCreates.slice(index, index + batchSize)

    if (!batch.length) {
      continue
    }

    const result = await prisma.wordCatalog.createMany({
      data: batch.map((item) => ({
        word: item.word,
        translation: "",
        cefrLevel: item.cefrLevel,
        partOfSpeech: item.partOfSpeech,
        topic: "general",
        example: "",
        phonetic: "",
        priority: item.priority,
        isPublished: false,
        source: WORDS_CEFR_DATASET_SOURCE,
        sourceRef: item.sourceId,
        enrichmentStatus: "pending",
        reviewStatus: "draft",
        enrichmentError: null,
        lastEnrichedAt: null
      })),
      skipDuplicates: true
    })

    imported += result.count
  }

  return {
    imported,
    totalRead: datasetWords.length
  }
}

export async function enrichCatalogEntry(
  prisma: PrismaClient,
  entry: WordCatalog
): Promise<EnrichmentResult> {
  const translationResult = await resolveTranslationDetails({
    prisma,
    query: entry.word,
    sourceLang: "EN",
    targetLang: "RU"
  })
  const dictionary = await fetchDictionaryDetails(entry.word)
  const nextTranslation = translationResult?.translation?.trim() || entry.translation.trim()
  const nextTranslationAlternatives =
    translationResult?.translationAlternatives.length
      ? translationResult.translationAlternatives
      : entry.translationAlternatives
  const nextExample = dictionary.example?.trim() || entry.example.trim()
  const nextPhonetic = dictionary.phonetic?.trim() || entry.phonetic.trim()

  if (!nextTranslation || !nextExample || !nextPhonetic) {
    const missingParts = [
      !nextTranslation ? "translation" : null,
      !nextExample ? "example" : null,
      !nextPhonetic ? "phonetic" : null
    ].filter(Boolean)

    return {
      translation: nextTranslation,
      translationAlternatives: nextTranslationAlternatives,
      example: nextExample,
      phonetic: nextPhonetic,
      status: "failed",
      error: `Missing ${missingParts.join(", ")}`
    }
  }

  return {
    translation: nextTranslation,
    translationAlternatives: nextTranslationAlternatives,
    example: nextExample,
    phonetic: nextPhonetic,
    status: "completed",
    error: null
  }
}

export async function enrichSeedWords({
  prisma,
  limit
}: EnrichSeedWordsOptions) {
  const entries = await prisma.wordCatalog.findMany({
    where: {
      source: WORDS_CEFR_DATASET_SOURCE,
      enrichmentStatus: "pending"
    },
    orderBy: [
      {
        priority: "desc"
      },
      {
        createdAt: "asc"
      }
    ],
    take: limit
  })

  let processed = 0
  let completed = 0
  let failed = 0

  for (const entry of entries) {
    const result = await enrichCatalogEntry(prisma, entry)

    await prisma.wordCatalog.update({
      where: {
        id: entry.id
      },
      data: {
        translation: result.translation,
        translationAlternatives: result.translationAlternatives,
        example: result.example,
        phonetic: result.phonetic,
        enrichmentStatus: result.status as CatalogEnrichmentStatus,
        enrichmentError: result.error,
        lastEnrichedAt: new Date()
      }
    })

    processed += 1
    if (result.status === "completed") {
      completed += 1
    } else {
      failed += 1
    }
  }

  return {
    processed,
    completed,
    failed
  }
}

export async function buildSeedReport(prisma: PrismaClient): Promise<SeedReport> {
  const [totals, grouped] = await Promise.all([
    prisma.wordCatalog.groupBy({
      by: ["enrichmentStatus"],
      where: {
        source: WORDS_CEFR_DATASET_SOURCE
      },
      _count: {
        _all: true
      }
    }),
    prisma.wordCatalog.groupBy({
      by: ["cefrLevel"],
      where: {
        source: WORDS_CEFR_DATASET_SOURCE
      },
      _count: {
        _all: true
      }
    })
  ])

  const published = await prisma.wordCatalog.count({
    where: {
      source: WORDS_CEFR_DATASET_SOURCE,
      isPublished: true
    }
  })

  const byLevel: Record<CefrLevel, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0
  }

  grouped.forEach((item) => {
    byLevel[item.cefrLevel] = item._count._all
  })

  return {
    imported: totals.reduce((sum, item) => sum + item._count._all, 0),
    enriched: totals.find((item) => item.enrichmentStatus === "completed")?._count._all ?? 0,
    failed: totals.find((item) => item.enrichmentStatus === "failed")?._count._all ?? 0,
    published,
    byLevel
  }
}

export function canPublishCatalogWord(word: Pick<WordCatalog, "translation" | "example" | "phonetic" | "enrichmentStatus">) {
  return Boolean(
    word.translation.trim() &&
      word.example.trim() &&
      word.phonetic.trim() &&
      word.enrichmentStatus === "completed"
  )
}

export function getCatalogReviewStatus(isPublished: boolean): CatalogReviewStatus {
  return isPublished ? "approved" : "draft"
}

import type { CefrLevel, PrismaClient } from "@prisma/client"
import { fetchDictionaryDetails } from "@/lib/dictionary"
import type { TranslationProvider } from "@/lib/types"

const APP_SETTINGS_ID = "app"
export const DEFAULT_DAILY_NEW_CARDS_LIMIT = 5
export const DEFAULT_REVIEW_LIVES = 3
export const DEFAULT_TRANSLATION_PROVIDER: TranslationProvider = "auto"
export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

interface ResolveTranslationOptions {
  prisma: PrismaClient
  query: string
  sourceLang: "EN" | "RU"
  targetLang: "EN" | "RU"
}

export interface TranslationResolution {
  translation: string | null
  translationAlternatives: string[]
}

function normalizeValue(value: string) {
  return value.trim()
}

export function normalizeCatalogKey(value: string) {
  return normalizeValue(value).toLowerCase()
}

export async function getOrCreateAppSettings(prisma: PrismaClient) {
  return prisma.appSettings.upsert({
    where: {
      id: APP_SETTINGS_ID
    },
    update: {},
    create: {
      id: APP_SETTINGS_ID,
      dailyNewCardsLimit: DEFAULT_DAILY_NEW_CARDS_LIMIT,
      reviewLives: DEFAULT_REVIEW_LIVES,
      translationProvider: DEFAULT_TRANSLATION_PROVIDER
    }
  })
}

export function isTranslationProvider(value: string): value is TranslationProvider {
  return value === "auto" || value === "catalog-only" || value === "deepl-only"
}

export function isCefrLevel(value: string): value is CefrLevel {
  return CEFR_LEVELS.includes(value as CefrLevel)
}

export async function findCatalogTranslation({
  prisma,
  query,
  sourceLang,
  targetLang
}: ResolveTranslationOptions): Promise<TranslationResolution | null> {
  const normalizedQuery = normalizeValue(query)

  if (!normalizedQuery) {
    return null
  }

  if (sourceLang === "EN" && targetLang === "RU") {
    const entry = await prisma.wordCatalog.findFirst({
      where: {
        word: {
          equals: normalizedQuery,
          mode: "insensitive"
        }
      },
      orderBy: {
        isPublished: "desc"
      }
    })

    if (!entry?.translation?.trim()) {
      return null
    }

    return {
      translation: entry.translation.trim(),
      translationAlternatives: entry.translationAlternatives
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  if (sourceLang === "RU" && targetLang === "EN") {
    const entry = await prisma.wordCatalog.findFirst({
      where: {
        translation: {
          equals: normalizedQuery,
          mode: "insensitive"
        }
      },
      orderBy: {
        isPublished: "desc"
      }
    })

    if (!entry?.word?.trim()) {
      return null
    }

    return {
      translation: entry.word.trim(),
      translationAlternatives: []
    }
  }

  return null
}

export async function findCatalogWordByWord(prisma: PrismaClient, word: string) {
  const normalizedWord = normalizeValue(word)

  if (!normalizedWord) {
    return null
  }

  return prisma.wordCatalog.findFirst({
    where: {
      word: {
        equals: normalizedWord,
        mode: "insensitive"
      }
    },
    orderBy: [
      {
        isPublished: "desc"
      },
      {
        priority: "desc"
      }
    ]
  })
}

export async function findCatalogWordByTranslation(prisma: PrismaClient, translation: string) {
  const normalizedTranslation = normalizeValue(translation)

  if (!normalizedTranslation) {
    return null
  }

  return prisma.wordCatalog.findFirst({
    where: {
      translation: {
        equals: normalizedTranslation,
        mode: "insensitive"
      }
    },
    orderBy: [
      {
        isPublished: "desc"
      },
      {
        priority: "desc"
      }
    ]
  })
}

export async function translateWithDeepL({
  query,
  sourceLang,
  targetLang
}: Omit<ResolveTranslationOptions, "prisma">): Promise<TranslationResolution | null> {
  if (!process.env.DEEPL_API_KEY) {
    return null
  }

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: [normalizeValue(query)],
      source_lang: sourceLang,
      target_lang: targetLang
    }),
    cache: "no-store"
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    translations?: Array<{
      text?: string
      alternatives?: Array<{
        text?: string
      }>
    }>
  }

  const translation = payload.translations?.[0]?.text?.trim() || null

  if (!translation) {
    return null
  }

  return {
    translation,
    translationAlternatives: (payload.translations?.[0]?.alternatives ?? [])
      .map((item) => item.text?.trim() || "")
      .filter((item) => Boolean(item) && item !== translation)
  }
}

export async function resolveTranslationDetails(options: ResolveTranslationOptions) {
  const settings = await getOrCreateAppSettings(options.prisma)
  const provider = isTranslationProvider(settings.translationProvider)
    ? settings.translationProvider
    : DEFAULT_TRANSLATION_PROVIDER

  if (provider !== "deepl-only") {
    const catalogTranslation = await findCatalogTranslation(options)

    if (catalogTranslation) {
      return catalogTranslation
    }
  }

  if (provider === "catalog-only") {
    return null
  }

  return translateWithDeepL(options)
}

export async function resolveTranslation(options: ResolveTranslationOptions) {
  const resolved = await resolveTranslationDetails(options)
  return resolved?.translation ?? null
}

export async function ensureCatalogWordLocalized(
  prisma: PrismaClient,
  catalogWordId: string
) {
  const word = await prisma.wordCatalog.findUnique({
    where: {
      id: catalogWordId
    }
  })

  if (!word) {
    return null
  }

  const currentTranslation = word.translation.trim()
  const currentTranslationAlternatives = word.translationAlternatives
    .map((item) => item.trim())
    .filter(Boolean)
  const currentExample = word.example.trim()
  const currentPhonetic = word.phonetic.trim()

  if (currentTranslation && currentExample && currentPhonetic) {
    return word
  }

  const [translationResult, dictionary] = await Promise.all([
    currentTranslation
      ? Promise.resolve<TranslationResolution>({
          translation: currentTranslation,
          translationAlternatives: currentTranslationAlternatives
        })
      : resolveTranslationDetails({
          prisma,
          query: word.word,
          sourceLang: "EN",
          targetLang: "RU"
        }),
    currentExample && currentPhonetic
      ? Promise.resolve({
          example: currentExample,
          phonetic: currentPhonetic
        })
      : fetchDictionaryDetails(word.word)
  ])

  const nextTranslation = translationResult?.translation?.trim() || currentTranslation
  const nextTranslationAlternatives =
    translationResult?.translationAlternatives.length
      ? translationResult.translationAlternatives
      : currentTranslationAlternatives
  const nextExample = dictionary.example?.trim() || currentExample
  const nextPhonetic = dictionary.phonetic?.trim() || currentPhonetic
  const nextStatus =
    nextTranslation && nextExample && nextPhonetic ? "completed" : "failed"

  return prisma.wordCatalog.update({
    where: {
      id: word.id
    },
    data: {
      translation: nextTranslation,
      translationAlternatives: nextTranslationAlternatives,
      example: nextExample,
      phonetic: nextPhonetic,
      enrichmentStatus: nextStatus,
      enrichmentError:
        nextStatus === "failed"
          ? "Missing translation, example, or phonetic after on-demand enrichment."
          : null,
      lastEnrichedAt: new Date()
    }
  })
}

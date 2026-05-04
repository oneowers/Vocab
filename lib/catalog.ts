import type { CefrLevel, PrismaClient, Prisma } from "@prisma/client"
import { fetchDictionaryDetails } from "@/lib/dictionary"
import type { TranslationEngine, TranslationProvider, TranslationSource } from "@/lib/types"

const APP_SETTINGS_ID = "app"
export const DEFAULT_DAILY_NEW_CARDS_LIMIT = 5
export const DEFAULT_REVIEW_LIVES = 3
export const DEFAULT_CEFR_PROFILER_ENABLED = true
export const DEFAULT_TRANSLATION_PROVIDER: TranslationProvider = "auto"
export const DEFAULT_TRANSLATION_PRIORITY: TranslationEngine[] = ["catalog", "deepl", "langeek"]
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
  source: TranslationSource
}

function normalizeValue(value: string) {
  return value.trim()
}

export function normalizeCatalogKey(value: string) {
  return normalizeValue(value).toLowerCase()
}

export async function getOrCreateAppSettings(prisma: PrismaClient | Prisma.TransactionClient) {
  return prisma.appSettings.upsert({
    where: {
      id: APP_SETTINGS_ID
    },
    update: {},
    create: {
      id: APP_SETTINGS_ID,
      dailyNewCardsLimit: DEFAULT_DAILY_NEW_CARDS_LIMIT,
      reviewLives: DEFAULT_REVIEW_LIVES,
      cefrProfilerEnabled: DEFAULT_CEFR_PROFILER_ENABLED,
      translationProvider: DEFAULT_TRANSLATION_PROVIDER,
      translationPriority: DEFAULT_TRANSLATION_PRIORITY
    }
  })
}

export function isTranslationProvider(value: string): value is TranslationProvider {
  return value === "auto" || value === "catalog-only"
}

export function isTranslationEngine(value: string): value is TranslationEngine {
  return value === "catalog" || value === "deepl" || value === "langeek"
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
        .filter(Boolean),
      source: "catalog"
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
      translationAlternatives: [],
      source: "catalog"
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
      .filter((item) => Boolean(item) && item !== translation),
    source: "deepl"
  }
}

function pickLanGeekTranslation(payload: unknown, query: string) {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null
  }

  const normalizedQuery = query.trim().toLowerCase()
  const exactEntry =
    payload.find((item) => {
      if (!item || typeof item !== "object") {
        return false
      }

      const entry = (item as { entry?: unknown }).entry
      return typeof entry === "string" && entry.trim().toLowerCase() === normalizedQuery
    }) ?? payload[0]

  if (!exactEntry || typeof exactEntry !== "object") {
    return null
  }

  const record = exactEntry as {
    translation?: {
      localizedProperties?: {
        translation?: unknown
      }
    }
    localizedData?: unknown
  }

  const primary =
    typeof record.translation?.localizedProperties?.translation === "string"
      ? record.translation.localizedProperties.translation
          .split(",")
          .map((item) => item.trim())
          .find(Boolean) ?? null
      : null

  const alternatives = Array.isArray(record.localizedData)
    ? Array.from(
        new Set(
          record.localizedData
            .flatMap((item) =>
              typeof item === "string"
                ? item.split(",").map((part) => part.trim())
                : []
            )
            .filter((item) => item && item !== primary)
        )
      )
    : []

  if (!primary) {
    return null
  }

  return {
    translation: primary,
    translationAlternatives: alternatives,
    source: "langeek" as const
  }
}

export async function translateWithLanGeek({
  query,
  sourceLang,
  targetLang
}: Omit<ResolveTranslationOptions, "prisma">): Promise<TranslationResolution | null> {
  if (sourceLang !== "EN" || targetLang !== "RU") {
    return null
  }

  const response = await fetch(
    `https://api.langeek.co/v1/cs/en/ru/word/?term=${encodeURIComponent(normalizeValue(query))}&filter=,inCategory,photo`,
    {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    }
  ).catch(() => null)

  if (!response?.ok) {
    return null
  }

  const payload = (await response.json().catch(() => null)) as unknown

  if (!payload) {
    return null
  }

  const resolved = pickLanGeekTranslation(payload, query)

  if (!resolved?.translation) {
    return null
  }

  return resolved
}

async function resolveExternalTranslation(
  priority: TranslationEngine[],
  options: Omit<ResolveTranslationOptions, "prisma">
) {
  const chain = priority
    .filter((engine) => engine !== "catalog")
    .map((engine) => (engine === "deepl" ? translateWithDeepL : translateWithLanGeek))

  for (const translator of chain) {
    const resolved = await translator(options)

    if (resolved?.translation) {
      return resolved
    }
  }

  return null
}

export async function resolveTranslationDetails(options: ResolveTranslationOptions) {
  const settings = await getOrCreateAppSettings(options.prisma)
  const provider = isTranslationProvider(settings.translationProvider)
    ? settings.translationProvider
    : DEFAULT_TRANSLATION_PROVIDER
  const translationPriority = Array.from(
    new Set(
      (settings.translationPriority as string[])
        .filter(isTranslationEngine)
    )
  )
  const priority =
    translationPriority.length > 0
      ? translationPriority
      : DEFAULT_TRANSLATION_PRIORITY

  if (provider === "auto" && priority.includes("catalog")) {
    const catalogTranslation = await findCatalogTranslation(options)

    if (catalogTranslation) {
      return catalogTranslation
    }
  }

  if (provider === "catalog-only" || priority.every((engine) => engine === "catalog")) {
    return null
  }

  return resolveExternalTranslation(priority, options)
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
          translationAlternatives: currentTranslationAlternatives,
          source: "catalog"
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
  const nextSource =
    translationResult?.source && translationResult.source !== "catalog"
      ? translationResult.source
      : word.source

  return prisma.wordCatalog.update({
    where: {
      id: word.id
    },
    data: {
      translation: nextTranslation,
      translationAlternatives: nextTranslationAlternatives,
      example: nextExample,
      phonetic: nextPhonetic,
      source: nextSource,
      enrichmentStatus: nextStatus,
      enrichmentError:
        nextStatus === "failed"
          ? "Missing translation, example, or phonetic after on-demand enrichment."
          : null,
      lastEnrichedAt: new Date()
    }
  })
}

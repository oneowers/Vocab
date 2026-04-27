import type { CefrLevel, PrismaClient } from "@prisma/client"

const APP_SETTINGS_ID = "app"
export const DEFAULT_DAILY_NEW_CARDS_LIMIT = 5
export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

interface ResolveTranslationOptions {
  prisma: PrismaClient
  query: string
  sourceLang: "EN" | "RU"
  targetLang: "EN" | "RU"
}

function normalizeValue(value: string) {
  return value.trim()
}

export async function getOrCreateAppSettings(prisma: PrismaClient) {
  return prisma.appSettings.upsert({
    where: {
      id: APP_SETTINGS_ID
    },
    update: {},
    create: {
      id: APP_SETTINGS_ID,
      dailyNewCardsLimit: DEFAULT_DAILY_NEW_CARDS_LIMIT
    }
  })
}

export function isCefrLevel(value: string): value is CefrLevel {
  return CEFR_LEVELS.includes(value as CefrLevel)
}

export async function findCatalogTranslation({
  prisma,
  query,
  sourceLang,
  targetLang
}: ResolveTranslationOptions) {
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

    return entry?.translation?.trim() || null
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

    return entry?.word?.trim() || null
  }

  return null
}

export async function translateWithDeepL({
  query,
  sourceLang,
  targetLang
}: Omit<ResolveTranslationOptions, "prisma">) {
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
    }>
  }

  return payload.translations?.[0]?.text?.trim() || null
}

export async function resolveTranslation(options: ResolveTranslationOptions) {
  const catalogTranslation = await findCatalogTranslation(options)

  if (catalogTranslation) {
    return catalogTranslation
  }

  return translateWithDeepL(options)
}

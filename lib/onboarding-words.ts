import type { CefrLevel, Prisma, PrismaClient, User } from "@prisma/client"

import type { DailyWordCandidate, OnboardingWordSelectionPayload } from "@/lib/types"
import { CEFR_LEVEL_ORDER } from "@/lib/vocabulary-level-test"

const TARGET_SELECTION_SIZE = 5

function clampLevelIndex(index: number) {
  return Math.max(0, Math.min(CEFR_LEVEL_ORDER.length - 1, index))
}

function getConfidenceMap(value: Prisma.JsonValue | null | undefined) {
  const initial = CEFR_LEVEL_ORDER.reduce<Record<CefrLevel, number>>(
    (accumulator, level) => {
      accumulator[level] = 0
      return accumulator
    },
    {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0
    }
  )

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return initial
  }

  const record = value as Record<string, unknown>

  for (const level of CEFR_LEVEL_ORDER) {
    const nextValue = record[level]
    initial[level] = typeof nextValue === "number" ? Math.max(0, Math.min(100, Math.round(nextValue))) : 0
  }

  return initial
}

function getTargetLevels(estimatedLevel: CefrLevel, confidenceByLevel: Record<CefrLevel, number>) {
  const baseIndex = CEFR_LEVEL_ORDER.indexOf(estimatedLevel)
  const confidence = confidenceByLevel[estimatedLevel]

  if (confidence >= 75) {
    return [
      CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex - 1)],
      estimatedLevel,
      estimatedLevel,
      CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex + 1)],
      CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex + 1)]
    ]
  }

  if (confidence >= 55) {
    return [
      CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex - 1)],
      estimatedLevel,
      estimatedLevel,
      estimatedLevel,
      CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex + 1)]
    ]
  }

  return [
    CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex - 2)],
    CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex - 1)],
    CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex - 1)],
    estimatedLevel,
    CEFR_LEVEL_ORDER[clampLevelIndex(baseIndex + 1)]
  ]
}

function toCandidate(word: {
  id: string
  word: string
  translation: string
  example: string
  cefrLevel: CefrLevel
}): DailyWordCandidate {
  return {
    id: word.id,
    word: word.word,
    translation: word.translation,
    example: word.example?.trim() || null,
    cefrLevel: word.cefrLevel
  }
}

async function getExcludedWordIds(prisma: PrismaClient, userId: string) {
  const [claimed, cards] = await Promise.all([
    prisma.userCatalogWord.findMany({
      where: { userId },
      select: { wordCatalogId: true }
    }),
    prisma.card.findMany({
      where: {
        userId,
        catalogWordId: {
          not: null
        }
      },
      select: {
        catalogWordId: true
      }
    })
  ])

  return new Set<string>([
    ...claimed.map((item) => item.wordCatalogId),
    ...cards
      .map((item) => item.catalogWordId)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  ])
}

async function getCatalogPools(
  prisma: PrismaClient,
  excludedIds: string[]
) {
  const words = await prisma.wordCatalog.findMany({
    where: {
      isPublished: true,
      translation: {
        not: ""
      },
      id: {
        notIn: excludedIds
      }
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" }
    ],
    select: {
      id: true,
      word: true,
      translation: true,
      example: true,
      cefrLevel: true
    },
    take: 240
  })

  return CEFR_LEVEL_ORDER.reduce<Record<CefrLevel, typeof words>>(
    (accumulator, level) => {
      accumulator[level] = words.filter(
        (word) => word.cefrLevel === level && word.word.trim() && word.translation.trim()
      )
      return accumulator
    },
    {
      A1: [],
      A2: [],
      B1: [],
      B2: [],
      C1: [],
      C2: []
    }
  )
}

export async function buildOnboardingWordSelection(
  prisma: PrismaClient,
  user: Pick<User, "id" | "cefrLevel" | "levelTestEstimatedLevel" | "levelTestConfidence">
): Promise<OnboardingWordSelectionPayload> {
  const estimatedLevel = user.levelTestEstimatedLevel ?? user.cefrLevel
  const confidenceByLevel = getConfidenceMap(user.levelTestConfidence)
  const targetLevels = getTargetLevels(estimatedLevel, confidenceByLevel)
  const excludedIds = await getExcludedWordIds(prisma, user.id)
  const pools = await getCatalogPools(prisma, [...excludedIds])
  const selected: DailyWordCandidate[] = []
  const usedIds = new Set<string>()

  for (const targetLevel of targetLevels) {
    const nextWord = pools[targetLevel].find((word) => !usedIds.has(word.id))

    if (!nextWord) {
      continue
    }

    usedIds.add(nextWord.id)
    selected.push(toCandidate(nextWord))
  }

  if (selected.length < TARGET_SELECTION_SIZE) {
    for (const level of CEFR_LEVEL_ORDER) {
      for (const word of pools[level]) {
        if (usedIds.has(word.id)) {
          continue
        }

        usedIds.add(word.id)
        selected.push(toCandidate(word))

        if (selected.length >= TARGET_SELECTION_SIZE) {
          break
        }
      }

      if (selected.length >= TARGET_SELECTION_SIZE) {
        break
      }
    }
  }

  return {
    items: selected.slice(0, TARGET_SELECTION_SIZE),
    estimatedLevel,
    confidenceByLevel
  }
}

export async function getOnboardingReplacementWord(
  prisma: PrismaClient,
  user: Pick<User, "id" | "cefrLevel" | "levelTestEstimatedLevel" | "levelTestConfidence">,
  preferredLevel: CefrLevel,
  visibleIds: string[]
) {
  const estimatedLevel = user.levelTestEstimatedLevel ?? user.cefrLevel
  const confidenceByLevel = getConfidenceMap(user.levelTestConfidence)
  const excludedIds = await getExcludedWordIds(prisma, user.id)

  for (const visibleId of visibleIds) {
    excludedIds.add(visibleId)
  }

  const pools = await getCatalogPools(prisma, [...excludedIds])
  const preferredOrder = [
    preferredLevel,
    estimatedLevel,
    CEFR_LEVEL_ORDER[clampLevelIndex(CEFR_LEVEL_ORDER.indexOf(preferredLevel) - 1)],
    CEFR_LEVEL_ORDER[clampLevelIndex(CEFR_LEVEL_ORDER.indexOf(preferredLevel) + 1)]
  ]

  for (const level of preferredOrder) {
    const candidate = pools[level][0]

    if (candidate) {
      return toCandidate(candidate)
    }
  }

  for (const level of CEFR_LEVEL_ORDER) {
    const candidate = pools[level][0]

    if (candidate) {
      return toCandidate(candidate)
    }
  }

  return null
}

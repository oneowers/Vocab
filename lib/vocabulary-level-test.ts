import type { CefrLevel, PrismaClient } from "@prisma/client"

export const CEFR_LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

const QUESTION_LEVEL_PLAN: CefrLevel[] = [
  "A1",
  "A1",
  "A2",
  "A2",
  "B1",
  "B1",
  "B2",
  "B2",
  "C1",
  "C2"
]

const LEVEL_WEIGHT: Record<CefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6
}

const ESTIMATE_THRESHOLDS: Array<{ level: CefrLevel; score: number }> = [
  { level: "A1", score: 1 },
  { level: "A2", score: 4 },
  { level: "B1", score: 9 },
  { level: "B2", score: 16 },
  { level: "C1", score: 23 },
  { level: "C2", score: 29 }
]

interface CatalogChoice {
  id: string
  word: string
  translation: string
  cefrLevel: CefrLevel
}

export interface VocabularyLevelQuestion {
  id: string
  word: string
  cefrLevel: CefrLevel
  options: Array<{
    id: string
    text: string
  }>
}

export interface VocabularyLevelTestPayload {
  questions: VocabularyLevelQuestion[]
  levels: CefrLevel[]
}

export interface VocabularyLevelTestResult {
  estimatedLevel: CefrLevel
  confidenceByLevel: Record<CefrLevel, number>
  correctCount: number
  mistakesCount: number
}

function shuffle<T>(items: T[]) {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]]
  }

  return nextItems
}

function buildFallbackChoices(level: CefrLevel, count: number): CatalogChoice[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `fallback-${level}-${index}`,
    word: ["apple", "work", "travel", "choice", "memory", "evidence"][index % 6],
    translation: ["яблоко", "работа", "путешествие", "выбор", "память", "доказательство"][index % 6],
    cefrLevel: level
  }))
}

async function getCatalogWords(prisma: PrismaClient) {
  const words = await prisma.wordCatalog.findMany({
    where: {
      isPublished: true,
      translation: {
        not: ""
      }
    },
    orderBy: [
      {
        priority: "desc"
      },
      {
        createdAt: "asc"
      }
    ],
    select: {
      id: true,
      word: true,
      translation: true,
      cefrLevel: true
    },
    take: 240
  })

  return words.filter((word) => word.word.trim() && word.translation.trim())
}

export async function buildVocabularyLevelTest(
  prisma: PrismaClient
): Promise<VocabularyLevelTestPayload> {
  const catalogWords = await getCatalogWords(prisma)
  const wordsByLevel = CEFR_LEVEL_ORDER.reduce<Record<CefrLevel, CatalogChoice[]>>(
    (accumulator, level) => {
      accumulator[level] = catalogWords.filter((word) => word.cefrLevel === level)
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
  const usedQuestionIds = new Set<string>()
  const allChoices = catalogWords.length ? catalogWords : CEFR_LEVEL_ORDER.flatMap((level) => buildFallbackChoices(level, 6))

  const questions = QUESTION_LEVEL_PLAN.map((level, index) => {
    const sameLevelPool = wordsByLevel[level].filter((word) => !usedQuestionIds.has(word.id))
    const fallbackPool = allChoices.filter((word) => !usedQuestionIds.has(word.id))
    const questionWord = shuffle(sameLevelPool.length ? sameLevelPool : fallbackPool)[0]

    if (questionWord) {
      usedQuestionIds.add(questionWord.id)
    }

    const correctWord = questionWord ?? buildFallbackChoices(level, 1)[0]
    const distractors = shuffle(
      allChoices.filter(
        (word) =>
          word.id !== correctWord.id &&
          word.translation.trim().toLowerCase() !== correctWord.translation.trim().toLowerCase()
      )
    ).slice(0, 3)
    const options = shuffle([correctWord, ...distractors]).map((word) => ({
      id: word.id,
      text: word.translation
    }))

    return {
      id: correctWord.id,
      word: correctWord.word,
      cefrLevel: correctWord.cefrLevel,
      options: options.length >= 2 ? options : buildFallbackChoices(level, 4).map((word) => ({
        id: word.id,
        text: word.translation
      }))
    }
  }).slice(0, 10)

  return {
    questions,
    levels: CEFR_LEVEL_ORDER
  }
}

export async function evaluateVocabularyLevelTest(
  prisma: PrismaClient,
  answers: Array<{ questionId: string; selectedOptionId: string }>
): Promise<VocabularyLevelTestResult> {
  const normalizedAnswers = answers.slice(0, 10).filter((answer) => answer.questionId && answer.selectedOptionId)
  const questionIds = normalizedAnswers.map((answer) => answer.questionId)
  const words = await prisma.wordCatalog.findMany({
    where: {
      id: {
        in: questionIds
      }
    },
    select: {
      id: true,
      cefrLevel: true
    }
  })
  const wordById = new Map(words.map((word) => [word.id, word]))
  const perLevel = CEFR_LEVEL_ORDER.reduce<Record<CefrLevel, { asked: number; correct: number }>>(
    (accumulator, level) => {
      accumulator[level] = { asked: 0, correct: 0 }
      return accumulator
    },
    {
      A1: { asked: 0, correct: 0 },
      A2: { asked: 0, correct: 0 },
      B1: { asked: 0, correct: 0 },
      B2: { asked: 0, correct: 0 },
      C1: { asked: 0, correct: 0 },
      C2: { asked: 0, correct: 0 }
    }
  )

  let weightedScore = 0
  let correctCount = 0

  for (const answer of normalizedAnswers) {
    const word = wordById.get(answer.questionId)

    if (!word) {
      continue
    }

    const isCorrect = answer.questionId === answer.selectedOptionId
    perLevel[word.cefrLevel].asked += 1

    if (isCorrect) {
      correctCount += 1
      weightedScore += LEVEL_WEIGHT[word.cefrLevel]
      perLevel[word.cefrLevel].correct += 1
    }
  }

  const confidenceByLevel = CEFR_LEVEL_ORDER.reduce<Record<CefrLevel, number>>(
    (accumulator, level, index) => {
      const current = perLevel[level]
      const ownConfidence = current.asked ? (current.correct / current.asked) * 100 : 0
      const lowerLevels = CEFR_LEVEL_ORDER.slice(0, index)
      const lowerAverage = lowerLevels.length
        ? lowerLevels.reduce((total, lowerLevel) => {
            const lower = perLevel[lowerLevel]
            return total + (lower.asked ? (lower.correct / lower.asked) * 100 : 0)
          }, 0) / lowerLevels.length
        : ownConfidence

      accumulator[level] = Math.round(ownConfidence * 0.7 + lowerAverage * 0.3)
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
  const estimatedLevel =
    [...ESTIMATE_THRESHOLDS]
      .reverse()
      .find((threshold) => weightedScore >= threshold.score)?.level ?? "A1"

  return {
    estimatedLevel,
    confidenceByLevel,
    correctCount,
    mistakesCount: Math.max(0, normalizedAnswers.length - correctCount)
  }
}

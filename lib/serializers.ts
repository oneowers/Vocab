import type { AppSettings, Card, GrammarTopic, User, WordCatalog } from "@prisma/client"

import type { AppSettingsRecord, AppUserRecord, CardRecord, GrammarTopicRecord, WordCatalogRecord } from "@/lib/types"

type SerializableCatalogWord = Pick<
  WordCatalog,
  "word" | "translation" | "translationAlternatives" | "example" | "phonetic" | "cefrLevel"
>

export type SerializableCard = Pick<
  Card,
  | "id"
  | "userId"
  | "catalogWordId"
  | "original"
  | "translation"
  | "translationAlternatives"
  | "direction"
  | "example"
  | "phonetic"
  | "dateAdded"
  | "nextReviewDate"
  | "lastReviewResult"
  | "reviewCount"
  | "correctCount"
  | "wrongCount"
> & {
  user?: {
    email: string
  }
  catalogWord?: SerializableCatalogWord | null
}

export function serializeUser(user: User): AppUserRecord {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    cefrLevel: user.cefrLevel,
    reviewLives: user.reviewLives,
    streak: user.streak,
    streakFreezes: user.streakFreezes,
    lastStreakRecoveryDate: user.lastStreakRecoveryDate,
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    lastReviewDate: user.lastReviewDate,
    proUntil: user.proUntil?.toISOString() ?? null,
    hasPassword: Boolean((user as any).passwordHash)
  }
}

export function serializeCard(
  card: SerializableCard
): CardRecord {
  const resolvedOriginal = card.catalogWord?.word ?? card.original ?? ""
  const resolvedTranslation = card.catalogWord?.translation ?? card.translation ?? ""
  const resolvedTranslationAlternatives =
    card.catalogWord?.translationAlternatives ?? card.translationAlternatives
  const resolvedExample =
    card.catalogWord?.example?.trim()
      ? card.catalogWord.example
      : card.example ?? null
  const resolvedPhonetic =
    card.catalogWord?.phonetic?.trim()
      ? card.catalogWord.phonetic
      : card.phonetic ?? null

  return {
    id: card.id,
    userId: card.userId,
    catalogWordId: card.catalogWordId ?? null,
    isCatalogLinked: Boolean(card.catalogWordId),
    original: resolvedOriginal,
    translation: resolvedTranslation,
    translationAlternatives: resolvedTranslationAlternatives,
    direction: card.direction as CardRecord["direction"],
    example: resolvedExample,
    phonetic: resolvedPhonetic,
    cefrLevel: card.catalogWord?.cefrLevel ?? null,
    dateAdded: card.dateAdded.toISOString(),
    nextReviewDate: card.nextReviewDate,
    lastReviewResult: card.lastReviewResult as CardRecord["lastReviewResult"],
    reviewCount: card.reviewCount,
    correctCount: card.correctCount,
    wrongCount: card.wrongCount,
    userEmail: card.user?.email
  }
}

export function serializeWordCatalog(word: WordCatalog): WordCatalogRecord {
  return {
    id: word.id,
    word: word.word,
    translation: word.translation,
    translationAlternatives: word.translationAlternatives,
    cefrLevel: word.cefrLevel,
    partOfSpeech: word.partOfSpeech,
    topic: word.topic,
    example: word.example,
    phonetic: word.phonetic,
    priority: word.priority,
    isPublished: word.isPublished,
    source: word.source,
    sourceRef: word.sourceRef,
    enrichmentStatus: word.enrichmentStatus,
    reviewStatus: word.reviewStatus,
    lastEnrichedAt: word.lastEnrichedAt?.toISOString() ?? null,
    enrichmentError: word.enrichmentError ?? null,
    createdAt: word.createdAt.toISOString(),
    updatedAt: word.updatedAt.toISOString()
  }
}

export function serializeGrammarTopic(topic: GrammarTopic): GrammarTopicRecord {
  return {
    id: topic.id,
    key: topic.key,
    titleEn: topic.titleEn,
    titleRu: topic.titleRu,
    category: topic.category,
    cefrLevel: topic.cefrLevel,
    description: topic.description,
    formulas: topic.formulas,
    usage: topic.usage,
    examples: topic.examples,
    commonMistakes: topic.commonMistakes,
    exercises: topic.exercises,
    isActive: topic.isActive,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString()
  }
}

export function serializeAppSettings(settings: AppSettings): AppSettingsRecord {
  return {
    id: settings.id,
    dailyNewCardsLimit: settings.dailyNewCardsLimit,
    reviewLives: settings.reviewLives,
    cefrProfilerEnabled: settings.cefrProfilerEnabled,
    translationProvider: settings.translationProvider as AppSettingsRecord["translationProvider"],
    translationPriority: (settings.translationPriority as AppSettingsRecord["translationPriority"]) ?? ["catalog", "deepl", "langeek"],
    grammarCorrectPoints: settings.grammarCorrectPoints,
    grammarPenaltyLow: settings.grammarPenaltyLow,
    grammarPenaltyMedium: settings.grammarPenaltyMedium,
    grammarPenaltyHigh: settings.grammarPenaltyHigh,
    mobileNavOrder: settings.mobileNavOrder ?? ["home", "cards", "translate", "practice", "grammar", "ai"],
    updatedAt: settings.updatedAt.toISOString()
  }
}

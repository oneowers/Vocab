import type { AppSettings, Card, User, WordCatalog } from "@prisma/client"

import type { AppSettingsRecord, AppUserRecord, CardRecord, WordCatalogRecord } from "@/lib/types"

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
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    lastReviewDate: user.lastReviewDate
  }
}

export function serializeCard(
  card: Card & {
    user?: {
      email: string
    }
  }
): CardRecord {
  return {
    id: card.id,
    userId: card.userId,
    catalogWordId: card.catalogWordId ?? null,
    original: card.original,
    translation: card.translation,
    direction: card.direction as CardRecord["direction"],
    example: card.example ?? null,
    phonetic: card.phonetic ?? null,
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
    cefrLevel: word.cefrLevel,
    partOfSpeech: word.partOfSpeech,
    topic: word.topic,
    example: word.example,
    phonetic: word.phonetic,
    priority: word.priority,
    isPublished: word.isPublished,
    createdAt: word.createdAt.toISOString(),
    updatedAt: word.updatedAt.toISOString()
  }
}

export function serializeAppSettings(settings: AppSettings): AppSettingsRecord {
  return {
    id: settings.id,
    dailyNewCardsLimit: settings.dailyNewCardsLimit,
    updatedAt: settings.updatedAt.toISOString()
  }
}

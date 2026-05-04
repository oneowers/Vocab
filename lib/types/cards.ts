import type { CefrLevel, Direction, ReviewResult } from "./common"

export interface CardRecord {
  id: string
  userId: string
  catalogWordId?: string | null
  isCatalogLinked?: boolean
  original: string
  translation: string
  translationAlternatives: string[]
  direction: Direction
  example: string | null
  phonetic: string | null
  cefrLevel?: CefrLevel | null
  dateAdded: string
  nextReviewDate: string
  lastReviewResult: ReviewResult
  reviewCount: number
  correctCount: number
  wrongCount: number
  userEmail?: string
}

export interface DashboardSummary {
  streak: number
  reviewLives: number
  totalCards: number
  dueToday: number
  mastered: number
  weakCardsCount: number
  isFirstPractice?: boolean
}

export interface DailyCatalogStatus {
  dailyTarget: number
  todayCount: number
  savedCount: number
  waitingCount: number
  claimedToday: number
  dailyLimit: number
  remainingToday: number
  cefrLevel: CefrLevel
}

export interface CardsResponse {
  cards: CardRecord[]
  weakCards: CardRecord[]
  summary: DashboardSummary
  dailyCatalog: DailyCatalogStatus
}

export interface DailyClaimResponse {
  cards: CardRecord[]
  createdCount: number
  dailyTarget: number
  todayCount: number
  savedCount: number
  waitingCount: number
  claimedToday: number
  dailyLimit: number
  remainingToday: number
  limitReached: boolean
}

export interface ReviewSummary {
  correct: number
  wrong: number
  accuracy: number
  streak: number
}

export interface GuestReviewLog {
  id: string
  cardId: string
  result: ReviewResult
  createdAt: string
}

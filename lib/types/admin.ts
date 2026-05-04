import type { CefrLevel, TranslationProvider, TranslationEngine } from "./common"
import type { AppUserRecord } from "./auth"
import type { CardRecord } from "./cards"
import type { WordCatalogRecord } from "./catalog"
import type { GrammarTopicRecord } from "./grammar"
import type { ReviewResult } from "./common"

// ─── Paginated payloads ───────────────────────────────────────────────────────

export interface AdminUserRow extends AppUserRecord {
  cardCount: number
  reviewCount: number
}

export interface AdminUsersPayload {
  items: AdminUserRow[]
  page: number
  totalPages: number
  totalItems: number
}

export interface AdminCardsPayload {
  items: CardRecord[]
  page: number
  totalPages: number
  totalItems: number
}

export interface AdminCatalogPayload {
  items: WordCatalogRecord[]
  page: number
  totalPages: number
  totalItems: number
}

export interface AdminGrammarTopicsPayload {
  items: GrammarTopicRecord[]
  page: number
  totalPages: number
  totalItems: number
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettingsRecord {
  id: string
  dailyNewCardsLimit: number
  reviewLives: number
  cefrProfilerEnabled: boolean
  translationProvider: TranslationProvider
  translationPriority: TranslationEngine[]
  grammarCorrectPoints: number
  grammarPenaltyLow: number
  grammarPenaltyMedium: number
  grammarPenaltyHigh: number
  mobileNavOrder: string[]
  updatedAt: string
}

export interface AdminSettingsPayload {
  settings: AppSettingsRecord
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsDay {
  date: string
  label: string
  newUsers: number
  newCards: number
  totalSessions: number
  totalReviews: number
}

export interface RecentActivity {
  id: string
  email: string
  word: string
  result: ReviewResult
  createdAt: string
}

export interface AdminAnalyticsPayload {
  days: AnalyticsDay[]
  totals: {
    totalUsers: number
    totalCards: number
    totalReviews: number
    totalSessions: number
    reviewsToday: number
    activeUsersLast7Days: number
  }
  onboarding: {
    onboardingStarted: number
    onboardingCompleted: number
    firstPracticeStarted: number
    firstPracticeCompleted: number
    firstPracticeD1Return: number
    aiChallengeStarted: number
    aiChallengeCompleted: number
  }
  retention: {
    activeUsersD1: number
    activeUsersD7: number
    activeUsersD30: number
  }
  wrongByCefr: Record<CefrLevel, number>
  catalogEngagement: {
    claimsToday: number
    catalogRatio: number
  }
  seedCatalog: {
    imported: number
    enriched: number
    failed: number
    published: number
    byLevel: Record<CefrLevel, number>
  }
  recentActivity: RecentActivity[]
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────

export interface PromoCodeRecord {
  id: string
  code: string
  description: string | null
  maxUses: number | null
  currentUses: number
  expiresAt: string | null
  isActive: boolean
  proDurationDays: number
  createdAt: string
  updatedAt: string
}

export interface AdminPromoCodesPayload {
  items: PromoCodeRecord[]
  page: number
  totalPages: number
  totalItems: number
}

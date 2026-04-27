import type { LucideIcon } from "lucide-react"

export type Role = "USER" | "PRO" | "ADMIN"
export type Direction = "en-ru" | "ru-en"
export type ReviewResult = "known" | "unknown"
export type CardStatusFilter = "All" | "known" | "unknown"
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

export interface CardRecord {
  id: string
  userId: string
  catalogWordId?: string | null
  original: string
  translation: string
  direction: Direction
  example: string | null
  phonetic: string | null
  dateAdded: string
  nextReviewDate: string
  lastReviewResult: ReviewResult
  reviewCount: number
  correctCount: number
  wrongCount: number
  userEmail?: string
}

export interface AppUserRecord {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: Role
  cefrLevel: CefrLevel
  reviewLives: number
  streak: number
  createdAt: string
  lastActiveAt: string | null
  lastReviewDate: string | null
}

export interface WordCatalogRecord {
  id: string
  word: string
  translation: string
  cefrLevel: CefrLevel
  partOfSpeech: string
  topic: string
  example: string
  phonetic: string
  priority: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface AppSettingsRecord {
  id: string
  dailyNewCardsLimit: number
  updatedAt: string
}

export interface ProfileActivityDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface ProfileActivityMonthLabel {
  label: string
  weekIndex: number
}

export interface ProfileActivityPayload {
  activeDaysLastYear: number
  totalReviewsLastYear: number
  days: ProfileActivityDay[]
  months: ProfileActivityMonthLabel[]
}

export interface DashboardSummary {
  streak: number
  reviewLives: number
  totalCards: number
  dueToday: number
  mastered: number
}

export interface CardsResponse {
  cards: CardRecord[]
  summary: DashboardSummary
  dailyCatalog: DailyCatalogStatus
}

export interface DailyCatalogStatus {
  claimedToday: number
  dailyLimit: number
  remainingToday: number
  cefrLevel: CefrLevel
}

export interface ReviewSummary {
  correct: number
  wrong: number
  accuracy: number
  streak: number
}

export interface ChartPoint {
  date: string
  label: string
  value: number
}

export interface StatsPayload {
  currentStreak: number
  longestStreak: number
  accuracyRate: number
  cardsAdded: ChartPoint[]
  reviewsPerDay: ChartPoint[]
  hardestCards: CardRecord[]
  dueByDay: ChartPoint[]
}

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

export interface AdminSettingsPayload {
  settings: AppSettingsRecord
}

export interface DailyClaimResponse {
  cards: CardRecord[]
  createdCount: number
  claimedToday: number
  dailyLimit: number
  remainingToday: number
  limitReached: boolean
}

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
  recentActivity: RecentActivity[]
}

export interface TranslationPayload {
  translation: string
}

export interface DictionaryPayload {
  example: string | null
  phonetic: string | null
}

export interface GuestReviewLog {
  id: string
  cardId: string
  result: ReviewResult
  createdAt: string
}

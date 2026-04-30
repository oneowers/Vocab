import type { LucideIcon } from "lucide-react"

export type Role = "USER" | "PRO" | "ADMIN"
export type Direction = "en-ru" | "ru-en"
export type ReviewResult = "known" | "unknown"
export type CardStatusFilter = "All" | "known" | "unknown" | "Waiting" | "Learned"
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
export type CatalogEnrichmentStatus = "pending" | "completed" | "failed"
export type CatalogReviewStatus = "draft" | "approved"
export type GrammarSeverity = "low" | "medium" | "high"
export type GrammarFindingSourceType = "writing_challenge"
export type GrammarScoreBand = "unknown" | "minor" | "weak" | "serious" | "critical" | "strong"
export type TranslationProvider =
  | "auto"
  | "catalog-only"
export type TranslationEngine = "catalog" | "deepl" | "langeek"
export type TranslationSource = TranslationEngine

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

export interface AppUserRecord {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: Role
  cefrLevel: CefrLevel
  reviewLives: number
  streak: number
  streakFreezes: number
  lastStreakRecoveryDate: string | null
  createdAt: string
  lastActiveAt: string | null
  lastReviewDate: string | null
}

export interface WordCatalogRecord {
  id: string
  word: string
  translation: string
  translationAlternatives: string[]
  cefrLevel: CefrLevel
  partOfSpeech: string
  topic: string
  example: string
  phonetic: string
  priority: number
  isPublished: boolean
  source: string | null
  sourceRef: string | null
  enrichmentStatus: CatalogEnrichmentStatus
  reviewStatus: CatalogReviewStatus
  lastEnrichedAt: string | null
  enrichmentError: string | null
  createdAt: string
  updatedAt: string
}

export interface GrammarTopicRecord {
  id: string
  key: string
  titleEn: string
  titleRu: string
  category: string
  cefrLevel: CefrLevel
  description: string
  examples: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GrammarFindingRecord {
  id: string
  topicKey: string
  severity: GrammarSeverity
  confidence: number
  isCorrect: boolean
  original: string
  corrected: string
  explanationRu: string
  scoreDelta: number
  createdAt: string
}

export interface GrammarSkillRecord {
  topic: GrammarTopicRecord
  score: number
  scoreBand: GrammarScoreBand
  evidenceCount: number
  positiveEvidenceCount: number
  negativeEvidenceCount: number
  lastDetectedAt: string | null
  latestFinding: GrammarFindingRecord | null
}

export interface GrammarSkillsPayload {
  items: GrammarSkillRecord[]
  weakCount: number
}

export interface AppSettingsRecord {
  id: string
  dailyNewCardsLimit: number
  reviewLives: number
  cefrProfilerEnabled: boolean
  translationProvider: TranslationProvider
  translationPriority: TranslationEngine[]
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
  weakCardsCount: number
  isFirstPractice?: boolean
}

export interface CardsResponse {
  cards: CardRecord[]
  weakCards: CardRecord[]
  summary: DashboardSummary
  dailyCatalog: DailyCatalogStatus
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

export interface DailyWordCandidate {
  id: string
  word: string
  translation: string
  example: string | null
  cefrLevel: CefrLevel
}

export interface OnboardingWordSelectionPayload {
  items: DailyWordCandidate[]
  estimatedLevel: CefrLevel
  confidenceByLevel: Record<CefrLevel, number>
}

export interface DailyWordsPreviewPayload {
  items: DailyWordCandidate[]
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

export interface PracticeWritingTargetWord {
  word: string
  translation: string
  cefrLevel: CefrLevel | null
}

export interface PracticeWritingUsedWord {
  word: string
  used: boolean
  correct: boolean
  feedback: string
}

export interface PracticeWritingGrammarMistake {
  original: string
  corrected: string
  explanationRu: string
}

export interface PracticeWritingGrammarFinding {
  topicKey: string
  severity: GrammarSeverity
  confidence: number
  isCorrect?: boolean
  original: string
  corrected: string
  explanationRu: string
}

export interface PracticeWritingChallengeResult {
  id?: string
  score: number
  levelFeedback: string
  usedWords: PracticeWritingUsedWord[]
  grammarMistakes: PracticeWritingGrammarMistake[]
  grammarFindings: PracticeWritingGrammarFinding[]
  whatWasGood: string
  improvedText: string
  nextTask: string
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

export interface DetailedStatsPayload {
  summary: {
    totalCardsLearned: number
    currentStreak: number
    activeDays: number
  }
  weeklyProgress: ChartPoint[]
  cardsByCefrLevel: Record<CefrLevel, number>
  recentMistakes: Array<{
    id: string
    cardId: string
    word: string
    createdAt: string
  }>
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

export interface AdminGrammarTopicsPayload {
  items: GrammarTopicRecord[]
  page: number
  totalPages: number
  totalItems: number
}

export interface ImportedDatasetWord {
  sourceId: string
  word: string
  cefrLevel: CefrLevel
  partOfSpeech: string
  priority: number
}

export interface EnrichmentResult {
  translation: string
  translationAlternatives: string[]
  example: string
  phonetic: string
  status: CatalogEnrichmentStatus
  error: string | null
}

export interface AdminSettingsPayload {
  settings: AppSettingsRecord
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

export interface TranslationPayload {
  translation: string
  translationAlternatives: string[]
  cefrLevel: CefrLevel | null
  source: TranslationSource
  cefrProfilerEnabled: boolean
}

export type CefrProfileBand = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Off-List"

export interface CefrProfileWord {
  word: string
  occurrences: number
}

export interface CefrProfileSegment {
  text: string
  level: CefrProfileBand | null
}

export interface CefrProfileBucket {
  level: CefrProfileBand
  percentage: number
  words: CefrProfileWord[]
}

export interface CefrProfilePayload {
  totalWordCount: number
  segments: CefrProfileSegment[]
  buckets: CefrProfileBucket[]
}

export interface DictionaryPayload {
  example: string | null
  phonetic: string | null
  synonyms: Array<{
    word: string
    cefrLevel: CefrLevel | null
  }>
}

export interface GuestReviewLog {
  id: string
  cardId: string
  result: ReviewResult
  createdAt: string
}

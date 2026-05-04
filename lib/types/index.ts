/**
 * @module lib/types
 *
 * Central type barrel for LexiFlow.
 *
 * Usage:
 *   import type { Role, AppUserRecord, CardRecord } from "@/lib/types"
 *
 * Sub-modules (for targeted imports or tree-shaking):
 *   "@/lib/types/common"    – shared primitives
 *   "@/lib/types/auth"      – auth, session, onboarding user shapes
 *   "@/lib/types/cards"     – CardRecord, CardsResponse, DailyCatalogStatus, …
 *   "@/lib/types/grammar"   – GrammarSkillRecord, GrammarTopicRecord, …
 *   "@/lib/types/practice"  – PracticeWritingChallenge*, WritingTaskType, …
 *   "@/lib/types/catalog"   – WordCatalogRecord, CefrProfilePayload, …
 *   "@/lib/types/onboarding"– OnboardingWordSelectionPayload, …
 *   "@/lib/types/stats"     – ChartPoint, StatsPayload, ProfileActivity*, …
 *   "@/lib/types/admin"     – Admin*Payload, AppSettingsRecord, …
 */

// ─── Common primitives ────────────────────────────────────────────────────────
export type {
  CefrLevel,
  CefrProfileBand,
  Direction,
  ReviewResult,
  GrammarSeverity,
  GrammarFindingSourceType,
  GrammarScoreBand,
  TranslationProvider,
  TranslationEngine,
  TranslationSource,
  CardStatusFilter,
  CatalogEnrichmentStatus,
  CatalogReviewStatus,
  NavItem,
} from "./common"

// ─── Auth / session / onboarding ─────────────────────────────────────────────
export type {
  Role,
  OnboardingStepValue,
  LearningGoalValue,
  DailyWordTargetValue,
  SupabaseUser,
  OnboardingUserShape,
  AppUserRecord,
} from "./auth"

export { isRole, isOnboardingStepValue } from "./auth"

// ─── Cards ────────────────────────────────────────────────────────────────────
export type {
  CardRecord,
  DashboardSummary,
  DailyCatalogStatus,
  CardsResponse,
  DailyClaimResponse,
  ReviewSummary,
  GuestReviewLog,
} from "./cards"

// ─── Grammar ─────────────────────────────────────────────────────────────────
export type {
  GrammarTopicRecord,
  GrammarFindingRecord,
  GrammarSkillRecord,
  GrammarSkillsPayload,
  GrammarWritingFeedback,
} from "./grammar"

// ─── Practice ─────────────────────────────────────────────────────────────────
export type {
  WritingTaskType,
  PracticeWritingTargetWord,
  PracticeWritingUsedWord,
  PracticeWritingGrammarMistake,
  PracticeWritingGrammarFinding,
  PracticeWritingChallengeResult,
  TranslationChallengeTask,
  TranslationChallengeResult,
} from "./practice"

// ─── Catalog ─────────────────────────────────────────────────────────────────
export type {
  WordCatalogRecord,
  DailyWordCandidate,
  DailyWordsPreviewPayload,
  TranslationPayload,
  DictionaryPayload,
  ImportedDatasetWord,
  EnrichmentResult,
  CefrProfileWord,
  CefrProfileSegment,
  CefrProfileBucket,
  CefrProfilePayload,
} from "./catalog"

// ─── Onboarding ──────────────────────────────────────────────────────────────
export type {
  OnboardingWordSelectionPayload,
} from "./onboarding"

// ─── Stats ────────────────────────────────────────────────────────────────────
export type {
  ChartPoint,
  StatsPayload,
  DetailedStatsPayload,
  ProfileActivityDay,
  ProfileActivityMonthLabel,
  ProfileActivityPayload,
} from "./stats"

// ─── Admin ────────────────────────────────────────────────────────────────────
export type {
  AdminUserRow,
  AdminUsersPayload,
  AdminCardsPayload,
  AdminCatalogPayload,
  AdminGrammarTopicsPayload,
  AppSettingsRecord,
  AdminSettingsPayload,
  AnalyticsDay,
  RecentActivity,
  AdminAnalyticsPayload,
  PromoCodeRecord,
  AdminPromoCodesPayload,
} from "./admin"

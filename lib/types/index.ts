/**
 * @module lib/types
 *
 * Central type barrel for LexiFlow.
 *
 * Import from this barrel instead of individual files:
 *   import type { Role, AppUserRecord } from "@/lib/types"
 *
 * Sub-modules (for tree-shaking or co-location):
 *   "@/lib/types/auth"    – auth, session, onboarding
 *   "@/lib/types/common"  – shared primitives (CefrLevel, Direction, …)
 */

// ─── Common primitives ────────────────────────────────────────────────────────
export type {
  CefrLevel,
  CefrProfileBand,
  Direction,
  ReviewResult,
  GrammarSeverity,
  TranslationProvider,
  TranslationEngine,
  TranslationSource,
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

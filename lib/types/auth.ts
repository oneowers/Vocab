import type { User as SupabaseUser } from "@supabase/supabase-js"

// ─── Primitive Auth Types ───────────────────────────────────────────────────

export type Role = "USER" | "PRO" | "ADMIN"

// ─── Onboarding ─────────────────────────────────────────────────────────────

export type OnboardingStepValue = "QUESTIONS" | "LEVEL_TEST" | "FIRST_WORDS" | "COMPLETED"

export type LearningGoalValue = "IELTS" | "WORK" | "DAILY_ENGLISH" | "TRAVEL" | "OTHER"

export type DailyWordTargetValue = 5 | 10 | 15 | 20

// ─── Session / User shapes ───────────────────────────────────────────────────

/** Supabase session user — thin shape returned by supabase.auth.getUser() */
export type { SupabaseUser }

/**
 * Minimal shape of the DB user needed for onboarding-redirect checks.
 * Matches the Pick<User, "onboardingCompletedAt" | "onboardingStep"> pattern
 * used throughout the codebase.
 */
export interface OnboardingUserShape {
  onboardingCompletedAt: Date | null
  onboardingStep: OnboardingStepValue
}

/**
 * Full application user as returned by `getOptionalAuthUser()` /
 * `requireSignedInAppUser()`. Extends the Prisma User shape with the
 * serialised fields used on the client.
 */
export interface AppUserRecord {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: Role
  cefrLevel: import("./common").CefrLevel
  reviewLives: number
  streak: number
  streakFreezes: number
  lastStreakRecoveryDate: string | null
  createdAt: string
  lastActiveAt: string | null
  lastReviewDate: string | null
  proUntil: string | null
  /** true if the user has a passwordHash set (email/password login possible) */
  hasPassword?: boolean
}

// ─── Helper guards / predicates (type-level) ─────────────────────────────────

/** Predicate: value is a valid Role */
export function isRole(value: string): value is Role {
  return value === "USER" || value === "PRO" || value === "ADMIN"
}

/** Predicate: value is a valid OnboardingStepValue */
export function isOnboardingStepValue(value: string): value is OnboardingStepValue {
  return (
    value === "QUESTIONS" ||
    value === "LEVEL_TEST" ||
    value === "FIRST_WORDS" ||
    value === "COMPLETED"
  )
}

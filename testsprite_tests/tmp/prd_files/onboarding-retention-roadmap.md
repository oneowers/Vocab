# Onboarding And Retention Roadmap

## 1. Current relevant structure

### Auth and session flow

- `app/(auth)/login/page.tsx` renders the login screen.
- `components/LoginCard.tsx` drives Google OAuth and local dev admin login.
- `app/api/auth/callback/route.ts` exchanges the Supabase code, creates the first user if needed, updates profile fields, and increments `AppAnalytics.newUsers`.
- `lib/auth.ts` is the main auth boundary for app pages and route handlers via:
  - `getOptionalAuthUser()`
  - `requireSignedInAppUser()`
  - `requireAdminAppUser()`

### Main learner surfaces

- `app/(app)/dashboard/page.tsx` loads `getUserCardsPageData()` and currently renders the translator-first experience through `components/CardsPageView.tsx`.
- `app/(app)/practice/page.tsx` and `app/(app)/review/page.tsx` both render `components/ReviewSession.tsx`.
- `app/(app)/profile/page.tsx` renders `components/ProfileView.tsx`.
- `app/(app)/stats/page.tsx` already exists and is backed by `getDetailedUserStatsData()`.
- `app/(app)/ai/page.tsx` renders `components/AiCoachView.tsx`.

### Data loading and analytics

- `lib/server-data.ts` is the main server aggregation layer for:
  - cards/dashboard data
  - review data
  - learner stats
  - profile activity
  - admin analytics
- `lib/server-cache.ts` provides tag-based cache invalidation for user and admin surfaces.

### Existing card and learning mechanics

- `Card` is the core learner-owned record.
- `ReviewLog` stores per-review outcomes.
- `PracticeSessionProgress` stores resumable multi-stage review state.
- `UserCatalogWord` stores daily catalog claims.
- `app/api/cards/daily/route.ts` already implements a daily catalog claim flow gated by user CEFR level and `AppSettings.dailyNewCardsLimit`.
- `app/api/review/route.ts` updates streak, counts, `lastActiveAt`, and `AppAnalytics.totalReviews/totalSessions`.

### Existing AI capability

- `app/api/ai-chat/route.ts` already supports AI study flows such as chat, story, quiz, memory, roleplay, and review.
- `app/api/cefr-profile/route.ts` can analyze text and return CEFR buckets.
- `components/AiCoachView.tsx` already has a "review" mode that can evolve into an optional writing challenge surface.

### Existing UI patterns

- Main app shell and navigation live in `components/AppShell.tsx` and `components/BottomTabBar.tsx`.
- Panels, rounded cards, gradients, and compact stacked mobile layouts are already established in:
  - `components/LoginCard.tsx`
  - `components/ProfileView.tsx`
  - `components/DailyWordsModal.tsx`
  - `components/TranslatorPanel.tsx`
  - `components/ReviewSession.tsx`

## 2. What already exists

### Useful foundations already in place

- Authenticated user creation and sign-in flow through Supabase.
- User CEFR level persisted on `User.cefrLevel` and editable from profile.
- Daily catalog claim mechanism with small per-day limits.
- Translator flow for discovering and saving words.
- Review session with flip, quiz, and write stages.
- Resume support for practice sessions via `PracticeSessionProgress`.
- Learner stats page and admin analytics page.
- Redis-backed rate limiting for external-facing AI/translation helpers.
- AI coach that can already generate writing- and review-oriented interactions.

### Important product constraints already satisfied

- Saved words and due words are already separate concepts.
- `/stats` and admin analytics exist and can be extended rather than rebuilt.
- Existing auth and navigation structure is stable and should be preserved.

## 3. What needs to be added

### Onboarding

- A real first-run onboarding flow after first authentication.
- Lightweight vocabulary level detection that does not overwhelm new users.
- A clear first-session path that gets the learner to value within 2-3 minutes.

### Daily learning queue

- A dedicated learner-facing daily queue concept separate from:
  - total saved words
  - total due review words
  - catalog inventory
- Queue should communicate a small daily target, not backlog anxiety.

### First-word selection

- Guided selection of the learner's first few words.
- Ability to seed the deck using:
  - CEFR target level
  - a few chosen interests/themes
  - a short starter pack
- This should complement, not remove, the current translator and daily catalog flows.

### Optional AI writing challenge

- A short optional writing prompt after onboarding or after first daily session.
- It should feel like a bonus habit-building challenge, not a mandatory blocker.
- It should tie into existing AI review capability where possible.

### Retention mechanics

- Explicit "come back tomorrow" loop after first successful session.
- Better day-1/day-7 habit cues for:
  - unfinished daily queue
  - completed queue with tomorrow tease
  - writing challenge streak or completion

## 4. Required Prisma model changes

These are planning proposals only for later phases. No schema changes should be made in Phase 0.

### User

Likely additions:

- `onboardingCompletedAt DateTime?`
- `onboardingStep String?`
- `learningGoal String?`
- `targetDailyMinutes Int?`
- `nativeLanguage String?` or a simpler `locale String?`
- `firstSessionCompletedAt DateTime?`
- `lastDailyQueueDate String?`
- `dailyQueueStreak Int @default(0)`
- `writingChallengeOptIn Boolean @default(false)`

Why:

- Tracks first-run progression and retention state without overloading existing `streak`.

### Card

Likely additions:

- `sourceKind String @default("manual")`
- `introducedAt DateTime?`
- `firstReviewedAt DateTime?`
- `isStarterWord Boolean @default(false)`
- `isDailyQueueSeed Boolean @default(false)`

Why:

- Separates manually saved words from guided onboarding and daily-queue introductions.

### New model: DailyQueueAssignment

Likely fields:

- `id`
- `userId`
- `date`
- `status` such as `planned | started | completed | skipped`
- `targetCount`
- `completedCount`
- `startedAt`
- `completedAt`

Likely relation model or list for assigned cards:

- either `DailyQueueAssignmentItem`
- or denormalized list field if product scope stays small

Why:

- Current app can count due reviews and claimed catalog words, but it cannot represent a real daily learning queue lifecycle.

### New model: OnboardingAssessment

Likely fields:

- `id`
- `userId`
- `type` such as `self_report` or `quick_check`
- `estimatedLevel`
- `answers Json`
- `createdAt`

Why:

- Allows future CEFR/placement improvements without overloading `User`.

### New model: WritingChallengeLog

Likely fields:

- `id`
- `userId`
- `date`
- `prompt`
- `submission`
- `aiFeedback`
- `estimatedCefr`
- `completedAt`

Why:

- Supports optional writing habit and retention analytics.

### AppAnalytics

Likely additions:

- `completedOnboardingToday Int @default(0)`
- `startedDailyQueueToday Int @default(0)`
- `completedDailyQueueToday Int @default(0)`
- `firstSessionCompletedToday Int @default(0)`
- `writingChallengeStartedToday Int @default(0)`
- `writingChallengeCompletedToday Int @default(0)`

Why:

- Existing analytics track retention and content quality at a high level, but not onboarding funnel completion or daily queue adoption.

## 5. Required routes, pages, and components

These are the recommended additions or changes for later phases.

### Routes/pages to add or extend

- `app/(app)/welcome/page.tsx`
  - first-run onboarding landing page after auth
- `app/(app)/welcome/level/page.tsx`
  - lightweight level self-selection or quick check
- `app/(app)/welcome/words/page.tsx`
  - first-word starter selection
- `app/(app)/today/page.tsx` or equivalent queue-first surface
  - dedicated daily queue screen
- `app/(app)/writing/page.tsx` or a modal/section inside an existing surface
  - optional AI writing challenge

### Existing pages/components that likely need extension

- `app/api/auth/callback/route.ts`
  - route new users into onboarding state
- `components/LoginCard.tsx`
  - optional copy updates only, no auth rewrite
- `components/AppShell.tsx`
  - potential nav entry or contextual CTA for daily queue
- `components/CardsPageView.tsx` / dashboard surface
  - evolve from translator-first to queue-aware homepage
- `components/ProfileView.tsx`
  - show onboarding completion and writing habit later if needed
- `components/ReviewSession.tsx`
  - support "daily queue review session" mode without breaking current review mode
- `components/DailyWordsModal.tsx`
  - may remain as supporting acquisition flow, but should no longer be the only daily-plan mechanic
- `components/AiCoachView.tsx`
  - reuse for optional writing challenge feedback or drill follow-up

### New reusable components likely needed

- `components/OnboardingShell.tsx`
- `components/OnboardingLevelPicker.tsx`
- `components/StarterWordPicker.tsx`
- `components/DailyQueueCard.tsx`
- `components/DailyQueueSummary.tsx`
- `components/WritingChallengeCard.tsx`
- `components/ReturnTomorrowCard.tsx`

## 6. Required API endpoints

These are the recommended backend additions for later phases.

### Onboarding APIs

- `GET /api/onboarding`
  - returns onboarding state for current user
- `PATCH /api/onboarding`
  - saves step progress, goals, level self-report, opt-ins
- `POST /api/onboarding/complete`
  - marks onboarding complete and triggers initial queue generation

### Level detection

- `POST /api/onboarding/level-assessment`
  - lightweight placement result from self-report or short quiz
- Could optionally reuse `POST /api/cefr-profile` for writing samples rather than building a new profiler.

### Daily queue

- `GET /api/daily-queue`
  - fetch current queue and progress
- `POST /api/daily-queue/generate`
  - create or refresh today's queue for first-run or next-day use
- `POST /api/daily-queue/complete`
  - mark queue session complete

### Starter words

- `GET /api/starter-words`
  - fetch curated starter pack based on CEFR level and themes
- `POST /api/starter-words/claim`
  - claim selected starter words and turn them into learner cards

### Writing challenge

- `GET /api/writing-challenge`
  - fetch today's optional prompt
- `POST /api/writing-challenge`
  - submit learner text and receive AI feedback

## 7. Risks

### Product risks

- The app currently uses the dashboard translator and daily catalog modal as the primary acquisition flow. Replacing that too abruptly could make existing power-user flows feel hidden.
- If onboarding is too long, learners will bounce before reaching the first success moment.
- If daily queue mixes saved words and due words, the product principle about overload will be violated.

### Data-model risks

- `User.streak` currently reflects review behavior, not daily queue completion. Reusing it for too many meanings will muddy analytics and UI.
- `Card.reviewCount > 0` currently stands in for “learned” in some places; onboarding and starter flows may need clearer lifecycle fields.
- The recent Prisma baseline cleanup is still in a transitional state, so any schema change phase must use proper migrations and the documented baseline process.

### Technical risks

- `ReviewSession` is already fairly stateful. Adding onboarding-specific logic directly into it without clear mode boundaries could make it brittle.
- AI writing challenge can become expensive or noisy if it is called too often or too early in the journey.
- Queue generation must not produce duplicate or conflicting card introductions with `cards/daily` and translator saves.

### Analytics risks

- Without dedicated onboarding and queue metrics, future product changes will be hard to evaluate.
- Existing `AppAnalytics` is daily aggregate oriented; some onboarding funnel details may need per-user event logs or derived counters.

## 8. Step-by-step implementation order

Recommended phased order for future runs:

### Phase 1: onboarding state and routing

- Add user-facing onboarding state fields.
- Add onboarding state API.
- Route first-time users from auth callback into onboarding instead of dropping them directly into the main app.
- Keep existing login and auth mechanics intact.

### Phase 2: lightweight level detection

- Implement a low-friction level picker or short assessment.
- Persist the result on the user.
- Reuse existing CEFR concepts and avoid heavy AI dependency for the first version.

### Phase 3: starter word selection

- Add curated first-word selection flow.
- Convert selected starter words into cards safely.
- Keep translator and daily catalog features available as secondary acquisition paths.

### Phase 4: dedicated daily queue

- Add a real daily queue model and API.
- Create a queue-first learner surface with a small daily target.
- Keep due review and saved cards separate in both data and UI language.

### Phase 5: first-session completion loop

- Add first-session completion state.
- Show a lightweight success/return-tomorrow message after the first meaningful session.
- Instrument the funnel in analytics.

### Phase 6: optional AI writing challenge

- Reuse current AI coach capability for a simple writing prompt and feedback loop.
- Make it clearly optional and post-value, not pre-value.
- Log participation for retention analysis.

### Phase 7: retention polish and dashboard integration

- Update dashboard to prioritize daily plan and next best action.
- Add progress summaries, queue reminders, and comeback cues.
- Ensure profile and stats reflect the new learner lifecycle cleanly.

### Phase 8: analytics and tuning

- Extend `AppAnalytics` for onboarding and queue completion metrics.
- Validate day-1/day-7/day-30 retention impact.
- Tune queue size, starter pack size, and writing prompt placement based on data.

## Recommended first implementation slice after Phase 0

The safest next phase is:

1. onboarding state fields
2. onboarding status API
3. redirect logic for first-time users
4. a minimal onboarding welcome screen

This creates a clean entry point for the rest of the feature set without forcing early changes into review, AI, or daily queue internals.

"use client"

import { useState, type ReactNode } from "react"
import { 
  AppleHeader, 
  AppleCard, 
  AppleTile,
  AppleListItem, 
  AppleAlert,
  AppleProgressCard,
  AppleSkillCard,
  AppleSkillListItem,
  AppleRecommendedCard,
  AppleSpinner
} from "@/components/AppleDashboardComponents"
import { BrandLogo } from "@/components/BrandLogo"
import { BottomTabBar } from "@/components/BottomTabBar"
import { StreakCard } from "@/components/StreakCard"
import { FlipCard } from "@/components/FlipCard"
import { MobileHeader } from "@/components/MobileHeader"
import { StickySwitcherHeader } from "@/components/StickySwitcherHeader"
import { GrammarTrendChart } from "@/components/grammar/GrammarTrendChart"
import { Skeleton, SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"
import { ProfileCardSkeleton } from "@/components/profile/ProfileCardSkeleton"
import { StatsCardsSkeleton } from "@/components/stats/StatsCardsSkeleton"
import { RecentMistakesSkeleton } from "@/components/stats/RecentMistakesSkeleton"
import { WordsListSkeleton } from "@/components/words/WordsListSkeleton"
import { GrammarTopicsSkeleton } from "@/components/grammar/GrammarTopicsSkeleton"
import { DailyPracticeSkeleton } from "@/components/practice/DailyPracticeSkeleton"
import { AIRecommendationSkeleton } from "@/components/ai/AIRecommendationSkeleton"
import { AdminSettingsSkeleton, AdminStatsGridSkeleton, AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeletons"
import { 
  Shield, 
  User, 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  Layout, 
  Navigation, 
  BookOpen, 
  Bell, 
  Settings,
  Code,
  Eye,
  Package,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Layers3,
  Component,
  FolderTree
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Category =
  | "Apple Core"
  | "Navigation"
  | "Learning"
  | "Feedback"
  | "Auth & Entry"
  | "Branding"
  | "Analytics"
  | "Project Inventory"

type ShowcaseItem = {
  id: string
  name: string
  description: string
  code: string
  render: ReactNode
  skeleton?: ReactNode
}

const inventoryItems: ShowcaseItem[] = [
  { id: "app-shell", name: "AppShell", description: "Desktop shell and primary app chrome.", code: "components/AppShell.tsx", render: <InventoryCard name="AppShell" path="components/AppShell.tsx" group="Layout" /> },
  { id: "admin-shell", name: "AdminShell", description: "Admin navigation shell for back-office pages.", code: "components/AdminShell.tsx", render: <InventoryCard name="AdminShell" path="components/AdminShell.tsx" group="Admin" /> },
  { id: "admin-table", name: "AdminTable", description: "Shared table wrapper for admin resources.", code: "components/AdminTable.tsx", render: <InventoryCard name="AdminTable" path="components/AdminTable.tsx" group="Admin" />, skeleton: <div className="w-full max-w-3xl"><AdminTableSkeleton /></div> },
  { id: "admin-overview", name: "AdminOverviewView", description: "Overview dashboard for admin analytics.", code: "components/AdminOverviewView.tsx", render: <InventoryCard name="AdminOverviewView" path="components/AdminOverviewView.tsx" group="Admin" />, skeleton: <div className="w-full max-w-4xl"><AdminStatsGridSkeleton /></div> },
  { id: "admin-analytics", name: "AdminAnalyticsView", description: "Detailed analytics dashboard.", code: "components/AdminAnalyticsView.tsx", render: <InventoryCard name="AdminAnalyticsView" path="components/AdminAnalyticsView.tsx" group="Admin" />, skeleton: <div className="w-full max-w-4xl"><AdminStatsGridSkeleton /></div> },
  { id: "admin-users", name: "AdminUsersView", description: "User management view with role controls.", code: "components/AdminUsersView.tsx", render: <InventoryCard name="AdminUsersView" path="components/AdminUsersView.tsx" group="Admin" /> },
  { id: "admin-cards", name: "AdminCardsView", description: "Admin card management screen.", code: "components/AdminCardsView.tsx", render: <InventoryCard name="AdminCardsView" path="components/AdminCardsView.tsx" group="Admin" /> },
  { id: "admin-catalog", name: "AdminCatalogView", description: "Catalog curation and publishing view.", code: "components/AdminCatalogView.tsx", render: <InventoryCard name="AdminCatalogView" path="components/AdminCatalogView.tsx" group="Admin" /> },
  { id: "admin-settings", name: "AdminSettingsView", description: "Global settings management panel.", code: "components/AdminSettingsView.tsx", render: <InventoryCard name="AdminSettingsView" path="components/AdminSettingsView.tsx" group="Admin" />, skeleton: <div className="w-full max-w-4xl"><AdminSettingsSkeleton /></div> },
  { id: "admin-promo", name: "AdminPromoCodesView", description: "Promo code creation and tracking.", code: "components/AdminPromoCodesView.tsx", render: <InventoryCard name="AdminPromoCodesView" path="components/AdminPromoCodesView.tsx" group="Admin" /> },
  { id: "admin-grammar-topics", name: "AdminGrammarTopicsView", description: "Grammar topic administration.", code: "components/AdminGrammarTopicsView.tsx", render: <InventoryCard name="AdminGrammarTopicsView" path="components/AdminGrammarTopicsView.tsx" group="Admin" /> },
  { id: "dashboard-view", name: "DashboardView", description: "Translate/dashboard root surface.", code: "components/DashboardView.tsx", render: <InventoryCard name="DashboardView" path="components/DashboardView.tsx" group="Core screens" /> },
  { id: "home-dashboard", name: "HomeDashboardView", description: "Main home dashboard composition.", code: "components/HomeDashboardView.tsx", render: <InventoryCard name="HomeDashboardView" path="components/HomeDashboardView.tsx" group="Core screens" />, skeleton: <div className="w-full max-w-xl"><DailyPracticeSkeleton /></div> },
  { id: "cards-page", name: "CardsPageView", description: "Deck browsing and filtering page.", code: "components/CardsPageView.tsx", render: <InventoryCard name="CardsPageView" path="components/CardsPageView.tsx" group="Core screens" />, skeleton: <div className="w-full max-w-4xl"><WordsListSkeleton /></div> },
  { id: "card-list", name: "CardList", description: "List/grid surface used by cards page.", code: "components/CardList.tsx", render: <InventoryCard name="CardList" path="components/CardList.tsx" group="Learning" /> },
  { id: "card-details", name: "CardDetailsModal", description: "Expanded card details modal.", code: "components/CardDetailsModal.tsx", render: <InventoryCard name="CardDetailsModal" path="components/CardDetailsModal.tsx" group="Learning" /> },
  { id: "daily-words", name: "DailyWordsModal", description: "Daily word claim modal.", code: "components/DailyWordsModal.tsx", render: <InventoryCard name="DailyWordsModal" path="components/DailyWordsModal.tsx" group="Learning" /> },
  { id: "review-session", name: "ReviewSession", description: "Review engine and interactive study flow.", code: "components/ReviewSession.tsx", render: <InventoryCard name="ReviewSession" path="components/ReviewSession.tsx" group="Learning" /> },
  { id: "review-overview", name: "ReviewSessionOverview", description: "Pre-session summary and launch UI.", code: "components/ReviewSessionOverview.tsx", render: <InventoryCard name="ReviewSessionOverview" path="components/ReviewSessionOverview.tsx" group="Learning" /> },
  { id: "review-stepper", name: "ReviewStageStepper", description: "Stepper for review stage progress.", code: "components/ReviewStageStepper.tsx", render: <InventoryCard name="ReviewStageStepper" path="components/ReviewStageStepper.tsx" group="Learning" /> },
  { id: "quiz-card", name: "QuizCard", description: "Multiple-choice review card.", code: "components/QuizCard.tsx", render: <InventoryCard name="QuizCard" path="components/QuizCard.tsx" group="Learning" /> },
  { id: "write-card", name: "WriteCard", description: "Typed-answer review card.", code: "components/WriteCard.tsx", render: <InventoryCard name="WriteCard" path="components/WriteCard.tsx" group="Learning" /> },
  { id: "translator-panel", name: "TranslatorPanel", description: "Translation workspace with results and actions.", code: "components/TranslatorPanel.tsx", render: <InventoryCard name="TranslatorPanel" path="components/TranslatorPanel.tsx" group="Tools" /> },
  { id: "practice-view", name: "PracticeView", description: "Practice mode entry and router.", code: "components/PracticeView.tsx", render: <InventoryCard name="PracticeView" path="components/PracticeView.tsx" group="Practice" /> },
  { id: "practice-mode", name: "PracticeModeSelector", description: "Mode chooser for practice flows.", code: "components/PracticeModeSelector.tsx", render: <InventoryCard name="PracticeModeSelector" path="components/PracticeModeSelector.tsx" group="Practice" /> },
  { id: "practice-bg", name: "PracticeBackground", description: "Shared backdrop for practice scenes.", code: "components/PracticeBackground.tsx", render: <InventoryCard name="PracticeBackground" path="components/PracticeBackground.tsx" group="Practice" /> },
  { id: "translation-challenge", name: "TranslationChallengeView", description: "Translation challenge screen.", code: "components/TranslationChallengeView.tsx", render: <InventoryCard name="TranslationChallengeView" path="components/TranslationChallengeView.tsx" group="Practice" /> },
  { id: "writing-challenge", name: "WritingChallengePage", description: "Writing prompt screen.", code: "components/WritingChallengePage.tsx", render: <InventoryCard name="WritingChallengePage" path="components/WritingChallengePage.tsx" group="Practice" /> },
  { id: "writing-feedback", name: "WritingFeedbackPage", description: "Feedback surface for writing tasks.", code: "components/WritingFeedbackPage.tsx", render: <InventoryCard name="WritingFeedbackPage" path="components/WritingFeedbackPage.tsx" group="Practice" /> },
  { id: "practice-writing", name: "PracticeWritingChallenge", description: "Practice writing orchestration component.", code: "components/PracticeWritingChallenge.tsx", render: <InventoryCard name="PracticeWritingChallenge" path="components/PracticeWritingChallenge.tsx" group="Practice" /> },
  { id: "writing-task-selector", name: "WritingTaskSelector", description: "Task picker for writing exercises.", code: "components/WritingTaskSelector.tsx", render: <InventoryCard name="WritingTaskSelector" path="components/WritingTaskSelector.tsx" group="Practice" /> },
  { id: "word-usage-feedback", name: "WordUsageFeedback", description: "Word usage feedback callout.", code: "components/WordUsageFeedback.tsx", render: <InventoryCard name="WordUsageFeedback" path="components/WordUsageFeedback.tsx" group="Practice" /> },
  { id: "grammar-library", name: "GrammarLibraryView", description: "Grammar library browsing surface.", code: "components/GrammarLibraryView.tsx", render: <InventoryCard name="GrammarLibraryView" path="components/GrammarLibraryView.tsx" group="Grammar" /> },
  { id: "grammar-practice", name: "GrammarPracticeView", description: "Grammar practice state machine and flows.", code: "components/GrammarPracticeView.tsx", render: <InventoryCard name="GrammarPracticeView" path="components/GrammarPracticeView.tsx" group="Grammar" /> },
  { id: "grammar-lesson", name: "GrammarLessonView", description: "Grammar lesson reading surface.", code: "components/GrammarLessonView.tsx", render: <InventoryCard name="GrammarLessonView" path="components/GrammarLessonView.tsx" group="Grammar" /> },
  { id: "grammar-quiz", name: "GrammarQuizView", description: "Grammar quiz interaction surface.", code: "components/GrammarQuizView.tsx", render: <InventoryCard name="GrammarQuizView" path="components/GrammarQuizView.tsx" group="Grammar" /> },
  { id: "grammar-exercise-runner", name: "GrammarExerciseRunner", description: "Runner for generated grammar exercises.", code: "components/GrammarExerciseRunner.tsx", render: <InventoryCard name="GrammarExerciseRunner" path="components/GrammarExerciseRunner.tsx" group="Grammar" /> },
  { id: "grammar-exercise-views", name: "GrammarExerciseViews", description: "Exercise renderers for grammar tasks.", code: "components/GrammarExerciseViews.tsx", render: <InventoryCard name="GrammarExerciseViews" path="components/GrammarExerciseViews.tsx" group="Grammar" /> },
  { id: "grammar-writing", name: "GrammarWritingExerciseView", description: "Writing exercise inside grammar flow.", code: "components/GrammarWritingExerciseView.tsx", render: <InventoryCard name="GrammarWritingExerciseView" path="components/GrammarWritingExerciseView.tsx" group="Grammar" /> },
  { id: "grammar-history", name: "GrammarHistoryView", description: "History view for grammar performance.", code: "components/GrammarHistoryView.tsx", render: <InventoryCard name="GrammarHistoryView" path="components/GrammarHistoryView.tsx" group="Grammar" /> },
  { id: "grammar-skills", name: "GrammarSkillsDashboard", description: "High-level grammar skill dashboard.", code: "components/GrammarSkillsDashboard.tsx", render: <InventoryCard name="GrammarSkillsDashboard" path="components/GrammarSkillsDashboard.tsx" group="Grammar" /> },
  { id: "grammar-mistake-card", name: "GrammarMistakeCard", description: "Individual grammar mistake explanation card.", code: "components/GrammarMistakeCard.tsx", render: <InventoryCard name="GrammarMistakeCard" path="components/GrammarMistakeCard.tsx" group="Grammar" /> },
  { id: "grammar-view", name: "GrammarView", description: "Grammar overview composition component.", code: "components/grammar/GrammarView.tsx", render: <InventoryCard name="GrammarView" path="components/grammar/GrammarView.tsx" group="Grammar subcomponents" /> },
  { id: "grammar-filters", name: "GrammarFilters", description: "Filters bar for grammar list.", code: "components/grammar/GrammarFilters.tsx", render: <InventoryCard name="GrammarFilters" path="components/grammar/GrammarFilters.tsx" group="Grammar subcomponents" /> },
  { id: "grammar-topic-list", name: "GrammarTopicList", description: "Topic list container for grammar items.", code: "components/grammar/GrammarTopicList.tsx", render: <InventoryCard name="GrammarTopicList" path="components/grammar/GrammarTopicList.tsx" group="Grammar subcomponents" /> },
  { id: "grammar-topic-row", name: "GrammarTopicRow", description: "Compact topic row for grammar lists.", code: "components/grammar/GrammarTopicRow.tsx", render: <InventoryCard name="GrammarTopicRow" path="components/grammar/GrammarTopicRow.tsx" group="Grammar subcomponents" /> },
  { id: "grammar-topic-card", name: "GrammarTopicCard", description: "Card presentation for a grammar topic.", code: "components/grammar/GrammarTopicCard.tsx", render: <InventoryCard name="GrammarTopicCard" path="components/grammar/GrammarTopicCard.tsx" group="Grammar subcomponents" /> },
  { id: "recommended-grammar", name: "RecommendedGrammarTopics", description: "Recommendation rail for grammar topics.", code: "components/grammar/RecommendedGrammarTopics.tsx", render: <InventoryCard name="RecommendedGrammarTopics" path="components/grammar/RecommendedGrammarTopics.tsx" group="Grammar subcomponents" /> },
  { id: "recommended-topic-card", name: "RecommendedTopicCard", description: "Highlight card for recommended grammar.", code: "components/grammar/RecommendedTopicCard.tsx", render: <InventoryCard name="RecommendedTopicCard" path="components/grammar/RecommendedTopicCard.tsx" group="Grammar subcomponents" /> },
  { id: "grammar-stats-summary", name: "GrammarStatsSummary", description: "Summary block for grammar metrics.", code: "components/grammar/GrammarStatsSummary.tsx", render: <InventoryCard name="GrammarStatsSummary" path="components/grammar/GrammarStatsSummary.tsx" group="Grammar subcomponents" /> },
  { id: "grammar-stats-row", name: "GrammarStatsRow", description: "Row layout for grammar stats.", code: "components/grammar/GrammarStatsRow.tsx", render: <InventoryCard name="GrammarStatsRow" path="components/grammar/GrammarStatsRow.tsx" group="Grammar subcomponents" /> },
  { id: "grammar-stats-compact", name: "GrammarStatsCompact", description: "Compact grammar stat widget.", code: "components/grammar/GrammarStatsCompact.tsx", render: <InventoryCard name="GrammarStatsCompact" path="components/grammar/GrammarStatsCompact.tsx" group="Grammar subcomponents" /> },
  { id: "profile-view", name: "ProfileView", description: "Profile page composition and activity surface.", code: "components/ProfileView.tsx", render: <InventoryCard name="ProfileView" path="components/ProfileView.tsx" group="Profile" />, skeleton: <div className="w-full max-w-xl"><ProfileCardSkeleton /></div> },
  { id: "stats-view", name: "StatsView", description: "Learning stats page component.", code: "components/StatsView.tsx", render: <InventoryCard name="StatsView" path="components/StatsView.tsx" group="Analytics" />, skeleton: <div className="w-full max-w-3xl"><StatsCardsSkeleton /></div> },
  { id: "stats-filter", name: "StatsFilter", description: "Stats filtering control.", code: "components/StatsFilter.tsx", render: <InventoryCard name="StatsFilter" path="components/StatsFilter.tsx" group="Analytics" /> },
  { id: "css-bar-chart", name: "CSSBarChart", description: "Reusable bar chart widget.", code: "components/CSSBarChart.tsx", render: <InventoryCard name="CSSBarChart" path="components/CSSBarChart.tsx" group="Analytics" /> },
  { id: "seed-catalog", name: "SeedCatalogSection", description: "Catalog breakdown analytics card.", code: "components/SeedCatalogSection.tsx", render: <InventoryCard name="SeedCatalogSection" path="components/SeedCatalogSection.tsx" group="Analytics" /> },
  { id: "ai-coach", name: "AiCoachView", description: "AI coach chat surface.", code: "components/AiCoachView.tsx", render: <InventoryCard name="AiCoachView" path="components/AiCoachView.tsx" group="AI" />, skeleton: <div className="w-full max-w-3xl"><AIRecommendationSkeleton /></div> },
  { id: "ai-coach-components", name: "AiCoachComponents", description: "Supporting chat UI pieces for AI coach.", code: "components/AiCoachComponents.tsx", render: <InventoryCard name="AiCoachComponents" path="components/AiCoachComponents.tsx" group="AI" /> },
  { id: "login-card", name: "LoginCard", description: "Authentication sheet and form.", code: "components/LoginCard.tsx", render: <InventoryCard name="LoginCard" path="components/LoginCard.tsx" group="Auth" /> },
  { id: "onboarding-flow", name: "OnboardingFlow", description: "Primary onboarding flow container.", code: "components/OnboardingFlow.tsx", render: <InventoryCard name="OnboardingFlow" path="components/OnboardingFlow.tsx" group="Onboarding" /> },
  { id: "onboarding-selection", name: "OnboardingWordSelection", description: "Word selection step in onboarding.", code: "components/OnboardingWordSelection.tsx", render: <InventoryCard name="OnboardingWordSelection" path="components/OnboardingWordSelection.tsx" group="Onboarding" /> },
  { id: "vocab-level-test", name: "VocabularyLevelTest", description: "Vocabulary placement test component.", code: "components/VocabularyLevelTest.tsx", render: <InventoryCard name="VocabularyLevelTest" path="components/VocabularyLevelTest.tsx" group="Onboarding" /> },
  { id: "toast", name: "ToastProvider / useToast", description: "Global toast provider and hook.", code: "components/Toast.tsx", render: <InventoryCard name="ToastProvider / useToast" path="components/Toast.tsx" group="Feedback" /> },
  { id: "modal", name: "Modal", description: "Generic modal shell.", code: "components/Modal.tsx", render: <InventoryCard name="Modal" path="components/Modal.tsx" group="Feedback" /> },
  { id: "confirm-modal", name: "ConfirmModal", description: "Reusable confirmation modal.", code: "components/ConfirmModal.tsx", render: <InventoryCard name="ConfirmModal" path="components/ConfirmModal.tsx" group="Feedback" /> },
  { id: "guest-banner", name: "GuestBanner", description: "Guest mode promotional banner.", code: "components/GuestBanner.tsx", render: <InventoryCard name="GuestBanner" path="components/GuestBanner.tsx" group="Feedback" /> },
  { id: "update-notifier", name: "UpdateNotifier", description: "Refresh notification when new version is available.", code: "components/UpdateNotifier.tsx", render: <InventoryCard name="UpdateNotifier" path="components/UpdateNotifier.tsx" group="Feedback" /> },
  { id: "startup-splash", name: "StartupSplash", description: "Application startup splash screen.", code: "components/StartupSplash.tsx", render: <InventoryCard name="StartupSplash" path="components/StartupSplash.tsx" group="Feedback" /> },
  { id: "get-pro", name: "GetProView", description: "Upgrade screen and promo redemption.", code: "components/GetProView.tsx", render: <InventoryCard name="GetProView" path="components/GetProView.tsx" group="Monetization" /> },
  { id: "pro-banner", name: "ProUpgradeBanner", description: "Upgrade promotion banner.", code: "components/ProUpgradeBanner.tsx", render: <InventoryCard name="ProUpgradeBanner" path="components/ProUpgradeBanner.tsx" group="Monetization" /> },
  { id: "page-transition", name: "PageTransition", description: "Shared page transition wrapper.", code: "components/PageTransition.tsx", render: <InventoryCard name="PageTransition" path="components/PageTransition.tsx" group="Motion" /> }
]

function InventoryCard({ name, path, group }: { name: string; path: string; group: string }) {
  return (
    <div className="w-full rounded-[28px] border border-white/10 bg-[#121214] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
            <FolderTree size={14} />
            {group}
          </div>
          <h3 className="mt-4 text-[22px] font-black tracking-tight text-white">{name}</h3>
          <p className="mt-2 text-sm font-medium text-white/45">{path}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-white/60">
          <Component size={20} />
        </div>
      </div>
    </div>
  )
}

function UIKitSwitch({
  checked,
  onChange,
  label
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-2 text-sm font-bold transition-all hover:bg-white/10"
    >
      <span className="text-white/70">{label}</span>
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-[#0A84FF]" : "bg-white/10"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </span>
    </button>
  )
}

function GenericCardSkeletonPreview() {
  return (
    <div className="w-full max-w-sm">
      <SkeletonCard className="rounded-[28px] border-white/[0.15] bg-[#1C1C1E] p-6">
        <SkeletonLine className="h-6 w-32 rounded-2xl" />
        <SkeletonLine className="mt-3 h-4 w-24 rounded-full" />
      </SkeletonCard>
    </div>
  )
}

function GenericTileSkeletonPreview() {
  return (
    <div className="w-full max-w-[220px]">
      <SkeletonCard className="rounded-[20px] border-white/[0.03] bg-[#1C1C1E] p-3.5">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <SkeletonLine className="mt-6 h-4 w-20 rounded-full" />
        <SkeletonLine className="mt-2 h-3 w-24 rounded-full" />
      </SkeletonCard>
    </div>
  )
}

function GenericListItemSkeletonPreview() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-[24px] border border-white/[0.03] bg-[#1C1C1E]">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-[8px]" />
              <div className="space-y-2">
                <SkeletonLine className="h-4 w-28 rounded-full" />
                <SkeletonLine className="h-3 w-20 rounded-full" />
              </div>
            </div>
            <SkeletonLine className="h-4 w-12 rounded-full" />
          </div>
          {index === 0 ? <div className="mt-3 h-px bg-white/[0.05]" /> : null}
        </div>
      ))}
    </div>
  )
}

function GenericSkillCardSkeletonPreview() {
  return (
    <div className="w-full max-w-sm">
      <SkeletonCard className="rounded-[24px] border-white/10 bg-[#1C1C1E] p-5">
        <div className="flex items-start justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-10 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonLine className="h-7 w-12 rounded-2xl" />
        </div>
        <SkeletonLine className="mt-6 h-5 w-36 rounded-xl" />
        <SkeletonLine className="mt-2 h-4 w-28 rounded-full" />
        <Skeleton className="mt-6 h-1.5 w-full rounded-full" />
      </SkeletonCard>
    </div>
  )
}

function GenericSkillListSkeletonPreview() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-[32px] border border-white/[0.05] bg-[#1C1C1E]">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <SkeletonLine className="h-4 w-36 rounded-full" />
            <SkeletonLine className="h-4 w-10 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
          {index < 2 ? <div className="mt-4 h-px bg-white/[0.05]" /> : null}
        </div>
      ))}
    </div>
  )
}

function GenericHeroSkeletonPreview() {
  return (
    <div className="w-full max-w-sm">
      <SkeletonCard className="rounded-[32px] border-white/[0.15] bg-[#1C1C1E] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonLine className="h-5 w-32 rounded-xl" />
              <SkeletonLine className="h-4 w-24 rounded-full" />
            </div>
          </div>
          <SkeletonLine className="h-6 w-10 rounded-full" />
        </div>
        <Skeleton className="mt-5 h-1.5 w-full rounded-full" />
      </SkeletonCard>
    </div>
  )
}

function GenericHeaderSkeletonPreview() {
  return (
    <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-black p-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-12 flex-1 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  )
}

function GenericChartSkeletonPreview() {
  return (
    <div className="w-full max-w-sm">
      <SkeletonCard className="rounded-[28px] bg-[#1C1C1E] p-4">
        <SkeletonLine className="h-4 w-24 rounded-full" />
        <div className="mt-6 grid grid-cols-[24px_1fr] gap-3">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonLine key={index} className="h-3 w-4 rounded-full" />
            ))}
          </div>
          <div className="flex h-40 items-end gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="flex-1 rounded-t-2xl" style={{ height: `${45 + index * 12}px` }} />
            ))}
          </div>
        </div>
      </SkeletonCard>
    </div>
  )
}

export default function UIKitPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("Apple Core")
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [skeletonStates, setSkeletonStates] = useState<Record<string, boolean>>({})

  const categories: { id: Category; icon: any }[] = [
    { id: "Apple Core", icon: Layout },
    { id: "Navigation", icon: Navigation },
    { id: "Learning", icon: BookOpen },
    { id: "Feedback", icon: Bell },
    { id: "Auth & Entry", icon: Shield },
    { id: "Branding", icon: Sparkles },
    { id: "Analytics", icon: BarChart3 },
    { id: "Project Inventory", icon: Layers3 }
  ]

  const components: Record<Category, ShowcaseItem[]> = {
    "Apple Core": [
      {
        id: "apple-card",
        name: "Apple Card",
        description: "Premium squircle container with spring animations.",
        code: `<AppleCard href="/stats">
  <div className="p-6">
    <h3 className="text-white font-bold">Statistics</h3>
    <p className="text-white/40">View your progress</p>
  </div>
</AppleCard>`,
        render: (
          <div className="max-w-[300px]">
            <AppleCard>
              <div className="p-6">
                <h3 className="text-white font-bold text-lg">Statistics</h3>
                <p className="text-white/40 text-sm">View your progress</p>
              </div>
            </AppleCard>
          </div>
        ),
        skeleton: <GenericCardSkeletonPreview />
      },
      {
        id: "apple-tile",
        name: "Apple Tile",
        description: "Compact navigational tile used in dashboard grids.",
        code: `<AppleTile title="Grammar" subtitle="12 topics" icon={<BookOpen size={18} />} color="bg-[#0A84FF]" href="/grammar" />`,
        render: (
          <div className="w-full max-w-[220px]">
            <AppleTile
              title="Grammar"
              subtitle="12 topics"
              icon={<BookOpen size={18} />}
              color="bg-[#0A84FF]"
              href="/grammar"
            />
          </div>
        ),
        skeleton: <GenericTileSkeletonPreview />
      },
      {
        id: "apple-progress-card",
        name: "Apple Progress Card",
        description: "Progress summary card with animated completion bar.",
        code: `<AppleProgressCard title="Level Test" current={18} total={24} href="/onboarding/level-test" />`,
        render: (
          <div className="w-full max-w-sm">
            <AppleProgressCard title="Level Test" current={18} total={24} href="/onboarding/level-test" />
          </div>
        ),
        skeleton: <GenericCardSkeletonPreview />
      },
      {
        id: "apple-list-item",
        name: "Apple List Item",
        description: "Standard row for settings and profile groups.",
        code: `<AppleListItem 
  title="Sign-In & Security" 
  icon={<ShieldCheck size={18} />} 
  iconColor="bg-[#8E8E93]" 
  rightLabel="Secure"
  showDivider={true}
/>`,
        render: (
          <div className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-white/[0.03] w-full max-w-sm">
            <AppleListItem 
              title="Personal Info" 
              icon={<User size={18} />} 
              iconColor="bg-[#007AFF]" 
              showDivider={true}
            />
            <AppleListItem 
              title="Sign-In & Security" 
              icon={<ShieldCheck size={18} />} 
              iconColor="bg-[#30D158]" 
              rightLabel="Secure"
            />
          </div>
        ),
        skeleton: <GenericListItemSkeletonPreview />
      },
      {
        id: "apple-skill-card",
        name: "Apple Skill Card",
        description: "Specialized card for lessons with badges, points, and progress bar.",
        code: "<AppleSkillCard title=\"Present Simple\" subtitle=\"Настоящее простое\" level=\"A1\" status=\"Learning\" points={-16} progress={45} />",
        render: (
          <div className="w-full max-w-sm">
            <AppleSkillCard 
              title="Present Simple"
              subtitle="Настоящее простое"
              level="A1"
              status="Learning"
              points={-16}
              progress={45}
            />
          </div>
        ),
        skeleton: <GenericSkillCardSkeletonPreview />
      },
      {
        id: "apple-skill-list-item",
        name: "Apple Skill List Item",
        description: "Compact list-style version of skill cards with dynamic colors.",
        code: "<AppleSkillListItem ... />",
        render: (
          <div className="bg-[#1C1C1E] rounded-[32px] overflow-hidden border border-white/[0.05] w-full max-w-sm">
            <AppleSkillListItem 
              title="Present Continuous"
              subtitle="Настоящее продолженное"
              level="A1"
              status="Learning"
              points={-65}
              progress={20}
              showDivider={true}
            />
            <AppleSkillListItem 
              title="Basic Word Order"
              subtitle="Порядок слов"
              level="A1"
              status="Learning"
              points={10}
              progress={55}
              showDivider={true}
            />
            <AppleSkillListItem 
              title="Advanced Modals"
              subtitle="Модальные глаголы"
              level="B2"
              status="Strong"
              points={85}
              progress={92}
            />
          </div>
        ),
        skeleton: <GenericSkillListSkeletonPreview />
      },
      {
        id: "apple-recommended-card",
        name: "Apple Recommended Card",
        description: "Prominent card for highlighted recommendations with sparkles.",
        code: "<AppleRecommendedCard ... />",
        render: (
          <div className="w-full max-w-sm">
            <AppleRecommendedCard 
              title="Present Perfect"
              subtitle="Настоящее совершенное"
              points={-45}
              progress={30}
            />
          </div>
        ),
        skeleton: <GenericHeroSkeletonPreview />
      },
      {
        id: "apple-spinner",
        name: "Apple Spinner",
        description: "Minimal loading indicator for inline asynchronous states.",
        code: `<AppleSpinner className="h-16" />`,
        render: (
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-[#1C1C1E]">
            <AppleSpinner className="h-16" />
          </div>
        ),
        skeleton: <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-[#1C1C1E]"><Skeleton className="h-16 w-16 rounded-full" /></div>
      }
    ],
    "Navigation": [
      {
        id: "dashboard-header",
        name: "Dashboard Header",
        description: "Large title with user name subtitle and profile link.",
        code: "<MobileHeader user={user} />",
        render: (
          <div className="w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-black h-24 flex flex-col justify-end pb-4">
             <div className="flex items-center justify-between px-6">
                <div className="flex flex-col">
                   <h1 className="text-[28px] font-bold tracking-tight text-white leading-none">LexiFlow+</h1>
                   <p className="text-[15px] font-medium text-white/40 mt-1">Muhammad Kamolov</p>
                </div>
                <ChevronRight size={20} className="text-white/20" />
             </div>
          </div>
        ),
        skeleton: <GenericHeaderSkeletonPreview />
      },
      {
        id: "segmented-header",
        name: "Segmented Header",
        description: "Sticky header with profile avatar, segmented control, and menu.",
        code: "<StickySwitcherHeader ... />",
        render: (
          <div className="w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-black/60 backdrop-blur-2xl p-4">
             <div className="flex items-center justify-between gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                   <User size={20} className="text-white/40" />
                </div>
                <div className="flex rounded-full border border-white/[0.08] bg-white/[0.04] p-1 shadow-2xl backdrop-blur-xl flex-1 max-w-[180px]">
                   <div className="grid grid-cols-2 w-full">
                      <div className="flex items-center justify-center py-2 text-[13px] font-bold text-white/30">Due</div>
                      <div className="bg-[#0A84FF] rounded-full flex items-center justify-center py-2 text-[13px] font-bold text-white shadow-lg">Learned</div>
                   </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                   <Settings size={20} className="text-white/40" />
                </div>
             </div>
          </div>
        ),
        skeleton: <GenericHeaderSkeletonPreview />
      },
      {
        id: "centered-header",
        name: "Centered Header",
        description: "Standard focused header with back button and centered title.",
        code: "<AppleHeader title=\"Grammar Library\" />",
        render: (
          <div className="w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-black h-20 flex flex-col justify-end pb-4">
             <div className="flex items-center justify-between px-6 relative">
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                   <ChevronLeft size={20} />
                </div>
                <h1 className="text-[17px] font-bold text-white absolute left-1/2 -translate-x-1/2">Grammar Library</h1>
                <div className="w-9" />
             </div>
          </div>
        ),
        skeleton: <GenericHeaderSkeletonPreview />
      },
      {
        id: "bottom-tab-bar",
        name: "Bottom Tab Bar",
        description: "iOS-style floating bottom navigation with sliding active pill.",
        code: "<BottomTabBar variant=\"app\" />",
        render: (
          <div className="relative h-24 w-full flex items-center justify-center bg-black/40 rounded-3xl border border-white/5">
            <div className="flex h-14 w-[320px] items-center justify-around rounded-[28px] bg-white/[0.05] border border-white/10 px-2">
               <div className="flex flex-col items-center gap-1 text-[#0A84FF]">
                  <Layout size={20} />
                  <span className="text-[10px] font-bold">Practice</span>
               </div>
               <div className="flex flex-col items-center gap-1 text-white/40">
                  <BookOpen size={20} />
                  <span className="text-[10px] font-bold">Grammar</span>
               </div>
               <div className="flex flex-col items-center gap-1 text-white/40">
                  <User size={20} />
                  <span className="text-[10px] font-bold">Profile</span>
               </div>
            </div>
          </div>
        ),
        skeleton: <div className="relative h-24 w-full rounded-3xl border border-white/5 bg-black/40 p-3"><Skeleton className="h-14 w-full rounded-[28px]" /></div>
      },
      {
        id: "desktop-sidebar",
        name: "Desktop Sidebar",
        description: "Primary side navigation for desktop views.",
        code: "<AppShell />",
        render: (
          <div className="w-64 h-[400px] bg-black border border-white/10 rounded-[28px] p-6 flex flex-col justify-between overflow-hidden scale-75 origin-top-left -mb-24">
             <div className="space-y-10">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center">
                      <BrandLogo />
                   </div>
                   <span className="text-sm font-black uppercase tracking-widest">LexiFlow</span>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-3 px-4 py-3 bg-[#0A84FF] rounded-xl text-sm font-bold shadow-lg">
                      <Layout size={18} />
                      <span>Practice</span>
                   </div>
                   <div className="flex items-center gap-3 px-4 py-3 text-white/30 rounded-xl text-sm font-bold">
                      <BookOpen size={18} />
                      <span>Grammar</span>
                   </div>
                </div>
             </div>
             <div className="p-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-black font-bold text-sm">MK</div>
                <div className="flex flex-col">
                   <span className="text-xs font-bold">Muhammad</span>
                   <span className="text-[10px] font-black text-white/20 uppercase">Pro Plan</span>
                </div>
             </div>
          </div>
        ),
        skeleton: <div className="w-64 h-[400px] scale-75 origin-top-left -mb-24"><Skeleton className="h-full rounded-[28px]" /></div>
      },
      {
        id: "admin-sidebar",
        name: "Admin Sidebar",
        description: "Distinct side navigation used within the Admin Panel.",
        code: "<AdminShell />",
        render: (
          <div className="w-64 h-[400px] bg-[#0A0A0A] border border-white/10 rounded-[28px] p-6 flex flex-col justify-between overflow-hidden scale-75 origin-top-left -mb-24">
             <div className="space-y-10">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                      <Shield size={20} className="text-[#0A84FF]" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none">Admin Panel</span>
                      <span className="text-sm font-black uppercase tracking-widest mt-1">LexiFlow</span>
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-3 px-4 py-3 bg-white text-black rounded-xl text-sm font-bold shadow-lg">
                      <User size={18} />
                      <span>Users</span>
                   </div>
                   <div className="flex items-center gap-3 px-4 py-3 text-white/30 rounded-xl text-sm font-bold">
                      <Settings size={18} />
                      <span>Settings</span>
                   </div>
                </div>
             </div>
             <div className="p-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center gap-3">
                <div className="h-10 w-10 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 font-bold text-sm">A</div>
                <div className="flex flex-col">
                   <span className="text-xs font-bold">Administrator</span>
                   <span className="text-[10px] font-black text-rose-500 uppercase">System</span>
                </div>
             </div>
          </div>
        ),
        skeleton: <div className="w-64 h-[400px] scale-75 origin-top-left -mb-24"><Skeleton className="h-full rounded-[28px]" /></div>
      }
    ],
    "Learning": [
      {
        id: "flip-card",
        name: "Flip Card",
        description: "Interactive flashcard with reveal animation.",
        code: `<FlipCard card={cardData} onAnswer={handleAnswer} />`,
        render: (
          <div className="w-full max-w-sm">
            <div className="relative overflow-hidden border border-white/10 bg-white/[0.03] p-8 text-center rounded-[2rem] min-h-[240px] flex flex-col justify-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20 mb-2">Original Word</p>
              <h2 className="text-2xl font-black text-white">Resilience</h2>
              <button className="mt-8 mx-auto h-11 px-6 rounded-2xl bg-white/[0.08] text-white font-bold text-sm">Reveal Translation</button>
            </div>
          </div>
        ),
        skeleton: <GenericCardSkeletonPreview />
      },
      {
        id: "streak-card",
        name: "Streak Card",
        description: "Motivation tracker for daily learning consistency.",
        code: `<StreakCard user={user} variant="default" />`,
        render: (
          <div className="w-full max-w-sm space-y-4">
             <div className="bg-white/[0.03] p-4 rounded-[24px] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                      <Flame size={24} className="animate-pulse" />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase">Daily Streak</p>
                      <p className="text-xl font-bold text-white">12 <span className="text-sm font-medium">days</span></p>
                   </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 text-xs font-bold">2</div>
             </div>
          </div>
        ),
        skeleton: <GenericHeroSkeletonPreview />
      }
    ],
    "Feedback": [
      {
        id: "apple-alert-live",
        name: "Apple Alert",
        description: "Premium modal for critical user feedback.",
        code: `<AppleAlert isOpen={true} title="..." message="..." />`,
        render: (
          <button 
            onClick={() => setIsAlertOpen(true)}
            className="h-12 px-8 rounded-2xl bg-[#0A84FF] text-white font-bold active:scale-95 transition-all shadow-lg"
          >
            Trigger Alert Modal
          </button>
        ),
        skeleton: <GenericCardSkeletonPreview />
      },
      {
        id: "toast-system",
        name: "Toast Notifications",
        description: "Subtle non-intrusive feedback messages.",
        code: `showToast("Action successful!", "success")`,
        render: (
          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1E] border border-white/5 shadow-xl">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span className="text-sm font-medium text-white">Profile updated</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1E] border border-white/5 shadow-xl">
              <AlertCircle size={18} className="text-rose-500" />
              <span className="text-sm font-medium text-white">Password mismatch</span>
            </div>
          </div>
        ),
        skeleton: <div className="w-full max-w-[280px] space-y-3"><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-12 rounded-xl" /></div>
      }
    ],
    "Auth & Entry": [
      {
        id: "login-card-sheet",
        name: "Login Card (Sheet Mode)",
        description: "The primary authentication experience with a landing view and bottom sheet.",
        code: `<LoginCard initialMode="login" />`,
        render: (
          <div className="w-full max-w-sm scale-[0.8] bg-black rounded-[40px] border border-white/10 overflow-hidden shadow-2xl p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-16 w-16 bg-white rounded-[22%] p-3 text-black">
                <BrandLogo />
              </div>
              <h3 className="text-2xl font-black text-white">LexiFlow</h3>
              <div className="w-full space-y-2">
                <div className="h-11 w-full bg-[#0A84FF] rounded-xl flex items-center justify-center text-sm font-bold">Sign In</div>
                <div className="h-11 w-full bg-white/5 rounded-xl flex items-center justify-center text-sm font-bold text-white/40">Create Account</div>
              </div>
            </div>
          </div>
        ),
        skeleton: <div className="w-full max-w-sm"><Skeleton className="h-[360px] rounded-[40px]" /></div>
      }
    ],
    "Branding": [
      {
        id: "brand-logo-kit",
        name: "Brand Logo",
        description: "LexiFlow primary visual identity in SVG format.",
        code: `<BrandLogo />`,
        render: (
          <div className="flex flex-wrap items-center gap-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 bg-white rounded-[22%] p-4 shadow-2xl flex items-center justify-center">
                <BrandLogo />
              </div>
              <span className="text-[12px] font-bold text-white/40">Large Squircle</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 bg-[#0A84FF] rounded-full p-2.5 shadow-xl flex items-center justify-center text-white">
                <BrandLogo />
              </div>
              <span className="text-[12px] font-bold text-white/40">Circle (Accent)</span>
            </div>
          </div>
        ),
        skeleton: <div className="flex flex-wrap items-center gap-12"><Skeleton className="h-20 w-20 rounded-[22%]" /><Skeleton className="h-12 w-12 rounded-full" /></div>
      }
    ],
    "Analytics": [
      {
        id: "trend-chart",
        name: "Grammar Trend Chart",
        description: "Compact, high-fidelity area chart for tracking point progression.",
        code: "<GrammarTrendChart data={chartData} />",
        render: (
          <div className="w-full max-w-sm">
            <AppleCard>
              <div className="p-4">
                <GrammarTrendChart data={[
                  { date: "2024-01-01", value: 10 },
                  { date: "2024-01-02", value: 25 },
                  { date: "2024-01-03", value: 15 },
                  { date: "2024-01-04", value: 42 },
                  { date: "2024-01-05", value: 38 },
                  { date: "2024-01-06", value: 55 }
                ]} />
              </div>
            </AppleCard>
          </div>
        ),
        skeleton: <GenericChartSkeletonPreview />
      }
    ],
    "Project Inventory": inventoryItems
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-[#111111] border-r border-white/5 p-6 space-y-8 sticky top-0 h-auto md:h-screen z-[100]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-white rounded-lg p-1.5 text-black">
            <BrandLogo />
          </div>
          <span className="font-black text-lg tracking-tight">LexiDocs</span>
        </div>

        <nav className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id)
                setSelectedComponent(null)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeCategory === cat.id 
                  ? "bg-[#0A84FF] text-white shadow-lg shadow-blue-500/20" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <cat.icon size={18} />
              {cat.id}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-white/5">
           <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Resources</p>
           <div className="flex items-center gap-3 text-sm font-bold text-white/20">
              <Settings size={18} />
              Design System v1.0
           </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 md:p-16 max-w-5xl">
        <header className="mb-16 space-y-4">
           <h1 className="text-5xl font-black tracking-tight">{activeCategory}</h1>
           <p className="text-xl text-white/40 font-medium">
             Explore the design system and the full component inventory used across the product.
           </p>
        </header>

        <div className="space-y-24">
          {components[activeCategory].map((comp) => (
            <section key={comp.id} className="space-y-6">
              <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">{comp.name}</h2>
                  <p className="text-white/40 font-medium">{comp.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {comp.skeleton ? (
                    <UIKitSwitch
                      checked={Boolean(skeletonStates[comp.id])}
                      onChange={(checked) =>
                        setSkeletonStates((current) => ({
                          ...current,
                          [comp.id]: checked
                        }))
                      }
                      label="Show Skeleton"
                    />
                  ) : null}
                  <button 
                    onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold text-sm"
                  >
                    {selectedComponent === comp.id ? <Eye size={18} /> : <Code size={18} />}
                    {selectedComponent === comp.id ? "Live Preview" : "Get Code"}
                  </button>
                </div>
              </div>

              <div className="relative min-h-[280px] bg-[#09090B] rounded-[40px] border border-white/[0.03] overflow-hidden flex items-center justify-center p-12">
                <AnimatePresence mode="wait">
                  {selectedComponent === comp.id ? (
                    <motion.div 
                      key="code"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full"
                    >
                      <pre className="p-8 bg-black/60 rounded-3xl overflow-x-auto border border-white/5 font-mono text-sm leading-relaxed">
                        <code className="text-[#0A84FF]">
                          {comp.code}
                        </code>
                      </pre>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key={skeletonStates[comp.id] && comp.skeleton ? "skeleton" : "render"}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      className="w-full flex justify-center"
                    >
                      {skeletonStates[comp.id] && comp.skeleton ? comp.skeleton : comp.render}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      </main>

      <AppleAlert 
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Access Granted"
        message="This component represents the gold standard of mobile user feedback. It uses spring physics for entry and exit."
      />
    </div>
  )
}

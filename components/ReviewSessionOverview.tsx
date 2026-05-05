"use client"

import Link from "next/link"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Sparkles, Trophy, Play, Settings2, Plus, LayoutGrid, CalendarDays, UserRound } from "lucide-react"
import { useState } from "react"
import { ReviewStageStepper } from "@/components/ReviewStageStepper"
import styles from "@/components/review-session.module.css"
import type { CardStatusFilter, DailyCatalogStatus } from "@/lib/types"

interface ReviewSessionOverviewProps {
  currentStage: "flip" | "quiz" | "write" | "challenge"
  completedStages: string[]
  cardsDue: number
  totalCards: number
  weakCardsCount: number
  loading?: boolean
  selectedStatus: CardStatusFilter
  practiceStage: "flip" | "quiz" | "write" | "challenge"
  guestMode: boolean
  claiming: boolean
  dailyCatalog: DailyCatalogStatus | null
  sessionLimit: number
  resumableSession: {
    wordCount: number
    activeStage: "flip" | "quiz" | "write" | "challenge"
    completedStages: string[]
  } | null
  onSelectStatus: (status: CardStatusFilter) => void
  onSelectPracticeStage: (stage: "flip" | "quiz" | "write" | "challenge") => void
  onClaimDailyWords: () => void
  onStartDue: () => void
  onStartPractice: () => void
  onResumeSession: () => void
  onRestartSession: () => void
  onStartWeakWords: () => void
}

const REVIEW_STEPS = [
  { value: "flip", label: "Flip" },
  { value: "quiz", label: "Quiz" },
  { value: "write", label: "Write" },
  { value: "challenge", label: "Challenge" }
] as const

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
} satisfies Variants

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.98,
    transition: { duration: 0.15 }
  }
} satisfies Variants

export function ReviewSessionOverview({
  currentStage,
  completedStages,
  cardsDue,
  totalCards,
  weakCardsCount,
  loading = false,
  selectedStatus,
  practiceStage,
  guestMode,
  claiming,
  dailyCatalog,
  sessionLimit,
  resumableSession,
  onSelectStatus,
  onSelectPracticeStage,
  onClaimDailyWords,
  onStartDue,
  onStartPractice,
  onResumeSession,
  onRestartSession,
  onStartWeakWords
}: ReviewSessionOverviewProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "practice">("daily")
  const dueSessionCount = Math.min(cardsDue, sessionLimit)
  const librarySessionCount = Math.min(totalCards, sessionLimit)
  const hasSavedJourney = Boolean(resumableSession)
  const waitingCount = dailyCatalog?.waitingCount ?? Math.max(totalCards - cardsDue, 0)

  return (
    <motion.section 
      className={`${styles.commandCenter} !pt-20 pb-28 px-4`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.topGradientOverlay} aria-hidden="true" />

      {/* Top Glass Switcher */}
      <div className={`${styles.glassSwitcherContainer} !top-4 !max-w-[340px]`}>
        <div className={styles.switcherCluster}>
          <div className={`${styles.glassSwitcher} !p-1`}>
            <button
              onClick={() => setActiveTab("daily")}
              className={`${styles.switcherTab} !px-4 !py-1.5 !text-[13px] ${activeTab === "daily" ? styles.switcherTabActive : ""}`}
            >
              <CalendarDays size={14} />
              Daily Path
            </button>
            <button
              onClick={() => setActiveTab("practice")}
              className={`${styles.switcherTab} !px-4 !py-1.5 !text-[13px] ${activeTab === "practice" ? styles.switcherTabActive : ""}`}
            >
              <LayoutGrid size={14} />
              Library
            </button>
            <motion.div 
              className={styles.switcherSlider}
              animate={{ x: activeTab === "daily" ? "0%" : "100%" }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
              style={{ top: "0.25rem", bottom: "0.25rem", left: "0.25rem" }}
            />
          </div>
          <Link href="/profile" aria-label="Open profile" className={`${styles.switcherProfileButton} !h-10 !w-10`}>
            <UserRound size={18} />
          </Link>
        </div>
      </div>

      <div className={styles.immersiveContent}>
        <AnimatePresence mode="wait">
          {activeTab === "daily" ? (
            <motion.div
              key="daily"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative overflow-hidden rounded-[32px] border border-white/[0.05] bg-[#1C1C1E] p-6 md:p-10 shadow-2xl"
            >
              <div className={styles.heroCardGlow} />
              
              <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/20">
                    <Sparkles className="text-blue-400" size={20} />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[22px] font-black tracking-tight text-white leading-tight">Daily Quest</h2>
                    <p className="text-[13px] font-semibold text-white/30">
                      3 steps · {cardsDue} words ready
                    </p>
                  </div>
                </div>

                {/* Step Progress */}
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <ReviewStageStepper
                    items={REVIEW_STEPS.slice(0, 3).map((item) => ({ ...item }))}
                    currentStage={currentStage}
                    completedValues={completedStages}
                    variant="hero"
                  />
                </div>

                {/* Training Weak Words (Optional) */}
                {weakCardsCount > 0 && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <h3 className="text-[14px] font-bold text-white">Train weak words</h3>
                        <p className="text-[12px] text-white/40">
                          {weakCardsCount} missed multiple times
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onStartWeakWords}
                        className="h-8 rounded-full px-3 text-[12px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/20 active:scale-95 transition-transform"
                      >
                        Fix
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-4 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/20">Today</span>
                    <span className="text-[15px] font-black text-white">{dailyCatalog?.todayCount ?? 0}</span>
                  </div>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/20">Waiting</span>
                    <span className="text-[15px] font-black text-white">{waitingCount}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  {!guestMode && (dailyCatalog?.remainingToday ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => void onClaimDailyWords()}
                      disabled={claiming}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-[14px] font-bold text-white/60 active:scale-[0.98] transition-all"
                    >
                      {claiming ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      ) : (
                        <Plus size={16} className="text-blue-400" />
                      )}
                      {claiming ? "Processing..." : dailyCatalog?.claimedToday ? "Edit daily words" : "Select daily words"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={hasSavedJourney ? onResumeSession : onStartDue}
                    disabled={loading || (!cardsDue && !hasSavedJourney)}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-black text-[16px] font-black shadow-[0_8px_30px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    ) : (
                      <>
                        <Play size={20} fill="currentColor" />
                        {hasSavedJourney
                          ? `Continue ${resumableSession?.activeStage ?? "flip"}`
                          : !cardsDue ? "Select Words First" : "Continue Journey"}
                      </>
                    )}
                  </button>

                  {hasSavedJourney && (
                    <button
                      type="button"
                      onClick={onRestartSession}
                      className="text-[13px] font-bold text-white/30 hover:text-white/60 transition-colors"
                    >
                      Restart Journey
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="practice"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative overflow-hidden rounded-[32px] border border-white/[0.05] bg-[#1C1C1E] p-6 md:p-10 shadow-2xl"
            >
              <div className={styles.heroCardGlow} style={{ background: "radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.15), transparent 60%)" }} />
              
              <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/20">
                    <LayoutGrid className="text-purple-400" size={20} />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[20px] font-black tracking-tight text-white leading-tight">Library</h2>
                    <p className="text-[13px] font-medium text-white/40">Practice specific modes</p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/20">Vocabulary Pool</span>
                    <div className="flex flex-wrap gap-2">
                      {(["All", "known", "unknown"] as CardStatusFilter[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => onSelectStatus(status)}
                          className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-all ${
                            selectedStatus === status 
                              ? "bg-white text-black" 
                              : "bg-white/[0.04] border border-white/[0.06] text-white/50"
                          }`}
                        >
                          {status === "All" ? "Everything" : status === "known" ? "Mastered" : "Needs Work"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/20">Training Mode</span>
                    <div className="flex flex-wrap gap-2">
                      {REVIEW_STEPS.map((step) => (
                        <button
                          key={step.value}
                          onClick={() => onSelectPracticeStage(step.value)}
                          className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-all ${
                            practiceStage === step.value 
                              ? "bg-white text-black" 
                              : "bg-white/[0.04] border border-white/[0.06] text-white/50"
                          }`}
                        >
                          {step.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-4 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/20">Available</span>
                    <span className="text-[15px] font-black text-white">{totalCards}</span>
                  </div>
                  {totalCards > sessionLimit && (
                    <>
                      <div className="h-3 w-[1px] bg-white/10" />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/20">Batch</span>
                        <span className="text-[15px] font-black text-white">{librarySessionCount}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={onStartPractice}
                    disabled={!totalCards}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-black text-[16px] font-black shadow-[0_8px_30px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    <Trophy size={20} />
                    {totalCards > sessionLimit
                      ? `Start ${librarySessionCount} words`
                      : "Launch Training"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

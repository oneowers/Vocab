"use client"

import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Sparkles, Trophy, Play, Settings2, Plus, LayoutGrid, CalendarDays } from "lucide-react"
import { useState } from "react"
import { ReviewStageStepper } from "@/components/ReviewStageStepper"
import styles from "@/components/review-session.module.css"
import type { CardStatusFilter, DailyCatalogStatus } from "@/lib/types"

interface ReviewSessionOverviewProps {
  currentStage: "flip" | "quiz" | "write"
  completedStages: string[]
  cardsDue: number
  totalCards: number
  loading?: boolean
  selectedStatus: CardStatusFilter
  practiceStage: "flip" | "quiz" | "write"
  guestMode: boolean
  claiming: boolean
  dailyCatalog: DailyCatalogStatus | null
  onSelectStatus: (status: CardStatusFilter) => void
  onSelectPracticeStage: (stage: "flip" | "quiz" | "write") => void
  onClaimDailyWords: () => void
  onStartDue: () => void
  onStartPractice: () => void
}

const REVIEW_STEPS = [
  { value: "flip", label: "Flip" },
  { value: "quiz", label: "Quiz" },
  { value: "write", label: "Write" }
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
  loading = false,
  selectedStatus,
  practiceStage,
  guestMode,
  claiming,
  dailyCatalog,
  onSelectStatus,
  onSelectPracticeStage,
  onClaimDailyWords,
  onStartDue,
  onStartPractice
}: ReviewSessionOverviewProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "practice">("daily")

  return (
    <motion.section 
      className={styles.commandCenter}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Glass Switcher */}
      <div className={styles.glassSwitcherContainer}>
        <div className={styles.glassSwitcher}>
          <button
            onClick={() => setActiveTab("daily")}
            className={`${styles.switcherTab} ${activeTab === "daily" ? styles.switcherTabActive : ""}`}
          >
            <CalendarDays size={14} />
            Daily Path
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={`${styles.switcherTab} ${activeTab === "practice" ? styles.switcherTabActive : ""}`}
          >
            <LayoutGrid size={14} />
            Library
          </button>
          <motion.div 
            className={styles.switcherSlider}
            animate={{ x: activeTab === "daily" ? "0%" : "100%" }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
          />
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
              className={styles.heroCard}
            >
              <div className={styles.heroCardGlow} />
              
              <div className={styles.heroHeader}>
                <div className={styles.heroIconWrap}>
                  <Sparkles className="text-white" size={24} />
                </div>
                <div className={styles.heroTitleGroup}>
                  <h2 className={styles.heroTitle}>Daily Quest</h2>
                  <p className={styles.heroSubtitle} style={{ marginTop: "0.25rem" }}>Master your vocabulary step-by-step</p>
                </div>
              </div>

              <div className={styles.questVisualizer} style={{ margin: "2.5rem 0 3rem" }}>
                <ReviewStageStepper
                  items={REVIEW_STEPS.map((item) => ({ ...item }))}
                  currentStage={currentStage}
                  completedValues={completedStages}
                  variant="hero"
                />
              </div>

              <div className={styles.heroStats} style={{ marginBottom: "2.5rem", padding: "1.5rem" }}>
                <div className={styles.heroStatItem}>
                  {loading ? (
                    <span className="skeleton skeleton-soft h-9 w-14 rounded-lg" />
                  ) : (
                    <span className={styles.heroStatValue}>{cardsDue}</span>
                  )}
                  <span className={styles.heroStatLabel}>Words Due</span>
                </div>
                <div className={styles.heroStatDivider} style={{ height: "2.5rem" }} />
                <div className={styles.heroStatItem}>
                  {loading ? (
                    <span className="skeleton skeleton-soft h-9 w-10 rounded-lg" />
                  ) : (
                    <span className={styles.heroStatValue}>3</span>
                  )}
                  <span className={styles.heroStatLabel}>Stages</span>
                </div>
              </div>

              <div className={styles.heroActions}>
                {!guestMode && (dailyCatalog?.remainingToday ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => void onClaimDailyWords()}
                    disabled={claiming}
                    className={`${styles.glassButtonSecondary} hover:bg-white/[0.08] transition-all`}
                  >
                    {claiming ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    ) : (
                      <Plus size={16} className="text-blue-400" />
                    )}
                    <span className="font-bold">{claiming ? "Processing..." : "Claim Daily Words"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onStartDue}
                  disabled={loading || !cardsDue}
                  className={`${styles.glassButtonPrimary} ${loading ? "pointer-events-none opacity-70" : ""}`}
                >
                  {loading ? (
                    <span className="skeleton skeleton-soft h-5 w-36 rounded-lg" />
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      Continue Journey
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="practice"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={styles.heroCard}
            >
              <div className={styles.heroCardGlow} style={{ background: "radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.15), transparent 60%)" }} />
              
              <div className={styles.heroHeader}>
                <div className={styles.heroIconWrap} style={{ background: "rgba(139, 92, 246, 0.2)" }}>
                  <LayoutGrid className="text-purple-400" size={24} />
                </div>
                <div className={styles.heroTitleGroup}>
                  <h2 className={styles.heroTitle}>Free Library</h2>
                  <p className={styles.heroSubtitle} style={{ marginTop: "0.25rem" }}>Practice specific categories and modes</p>
                </div>
              </div>

              <div className={styles.practiceOptions}>
                <div className={styles.optionSection}>
                  <span className={styles.optionLabel}>Vocabulary Pool</span>
                  <div className={styles.optionPills}>
                    {(["All", "known", "unknown"] as CardStatusFilter[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => onSelectStatus(status)}
                        className={`${styles.pill} ${selectedStatus === status ? styles.pillActive : ""}`}
                      >
                        {status === "All" ? "Everything" : status === "known" ? "Mastered" : "Needs Work"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.optionSection}>
                  <span className={styles.optionLabel}>Training Mode</span>
                  <div className={styles.optionPills}>
                    {REVIEW_STEPS.map((step) => (
                      <button
                        key={step.value}
                        onClick={() => onSelectPracticeStage(step.value)}
                        className={`${styles.pill} ${practiceStage === step.value ? styles.pillActive : ""}`}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.heroStatItem}>
                  <span className={styles.heroStatValue}>{totalCards}</span>
                  <span className={styles.heroStatLabel}>Available Cards</span>
                </div>
              </div>

              <div className={styles.heroActions}>
                <button
                  type="button"
                  onClick={onStartPractice}
                  disabled={!totalCards}
                  className={styles.glassButtonPrimary}
                  style={{ background: "#ffffff", color: "#000000" }}
                >
                  <Trophy size={18} />
                  Launch Training
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

"use client"

import { ReviewStageStepper } from "@/components/ReviewStageStepper"
import styles from "@/components/review-session.module.css"
import type { CardStatusFilter, DailyCatalogStatus } from "@/lib/types"

interface ReviewSessionOverviewProps {
  currentStage: "flip" | "quiz" | "write"
  completedStages: string[]
  cardsDue: number
  totalCards: number
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

export function ReviewSessionOverview({
  currentStage,
  completedStages,
  cardsDue,
  totalCards,
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
  return (
    <section className={`mx-auto `}>
      <div className={styles.sectionGrid}>
        <div className={styles.modeCard}>
          <div className={styles.modeCardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Daily session</p>
              <h2 className={styles.cardTitle}>Guided path for today&apos;s due words</h2>
              <p className={styles.cardBody}>
                Finish the full route in order: first Flip, then Quiz, then Write.
              </p>
            </div>
          </div>

          <div className={styles.questStageCluster}>
            <ReviewStageStepper
              items={REVIEW_STEPS.map((item) => ({ ...item }))}
              currentStage={currentStage}
              completedValues={completedStages}
              variant="hero"
            />
          </div>

          <div className={styles.dailyStatsCard}>
            <div className={styles.statValue}>{cardsDue}</div>
            <div className={styles.statLabel}>Words ready for today&apos;s session</div>
          </div>

          <section className=" flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {!guestMode ? (
                <button
                  type="button"
                  onClick={() => void onClaimDailyWords()}
                  disabled={claiming || (dailyCatalog?.remainingToday ?? 0) === 0}
                  className="button-secondary px-5 py-3 text-sm font-medium"
                >
                  {claiming ? "Adding..." : "Get today's words"}
                </button>
              ) : null}
            </div>
          </section>


          <button
            type="button"
            onClick={onStartDue}
            disabled={!cardsDue}
            className={`${styles.ctaButton} ${styles.ctaPrimary} ${styles.ctaFull}`}
          >
            Start daily session
          </button>
        </div>

        <div className={styles.modeCard}>
          <div className={styles.modeCardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Free practice</p>
              <h2 className={styles.cardTitle}>Repeat words your way</h2>
              <p className={styles.cardBody}>
                Choose which words to review and how you want to practice them.
              </p>
            </div>
          </div>

          <div className={styles.practiceGroup}>
            <p className={styles.groupLabel}>What to repeat</p>
            <div className={styles.filterRow}>
              {(["All", "known", "unknown"] as CardStatusFilter[]).map((status) => {
                const label =
                  status === "All" ? "All words" : status === "known" ? "Known" : "Unknown"

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onSelectStatus(status)}
                    className={`${styles.filterTab} ${selectedStatus === status ? styles.filterTabActive : ""
                      }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.practiceGroup}>
            <p className={styles.groupLabel}>Practice mode</p>
            <div className={styles.modeTabs}>
              {REVIEW_STEPS.map((step) => (
                <button
                  key={step.value}
                  type="button"
                  onClick={() => onSelectPracticeStage(step.value)}
                  className={`${styles.filterTab} ${practiceStage === step.value ? styles.filterTabActive : ""
                    }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.practiceFooter}>
            <div className={styles.practiceMeta}>
              <span className={styles.practiceMetaValue}>{totalCards}</span>
              <span className={styles.practiceMetaLabel}>words ready</span>
            </div>

            <button
              type="button"
              onClick={onStartPractice}
              disabled={!totalCards}
              className={`${styles.ctaButton} ${styles.ctaSecondary} ${styles.practiceStartButton}`}
            >
              Start {REVIEW_STEPS.find((step) => step.value === practiceStage)?.label}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

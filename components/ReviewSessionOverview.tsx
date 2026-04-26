"use client"

import Link from "next/link"
import { Heart } from "lucide-react"

import { ReviewStageStepper } from "@/components/ReviewStageStepper"
import styles from "@/components/review-session.module.css"
import type { CardStatusFilter } from "@/lib/types"

interface ReviewSessionOverviewProps {
  currentStage: "flip" | "quiz" | "write"
  completedStages: string[]
  lives: number
  cardsDue: number
  totalCards: number
  selectedStatus: CardStatusFilter
  onSelectStatus: (status: CardStatusFilter) => void
  onStartDue: () => void
  onRepeatAll: () => void
}

const REVIEW_STEPS = [
  { value: "flip", label: "Flip" },
  { value: "quiz", label: "Quiz" },
  { value: "write", label: "Write" }
] as const

export function ReviewSessionOverview({
  currentStage,
  completedStages,
  lives,
  cardsDue,
  totalCards,
  selectedStatus,
  onSelectStatus,
  onStartDue,
  onRepeatAll
}: ReviewSessionOverviewProps) {
  return (
    <section className={`panel mx-auto max-w-5xl ${styles.questPanel} ${styles.overviewShell}`}>
      <div className={styles.overviewHeader}>
        <div className={styles.overviewCopy}>
          <p className={styles.reviewEyebrow}>Review</p>
          <h1 className={styles.reviewTitle}>Start today&apos;s linked session</h1>
          <p className={styles.reviewBody}>
            Work through Flip, then Quiz, then Write. Each stage resets if you run out of
            lives.
          </p>
        </div>
        <Link
          href="/"
          prefetch
          className={`button-secondary inline-flex px-4 py-2 text-sm font-medium ${styles.exitButton}`}
        >
          Exit
        </Link>
      </div>

      <div className={styles.questStageCluster}>
        <ReviewStageStepper
          items={REVIEW_STEPS.map((item) => ({ ...item }))}
          currentStage={currentStage}
          completedValues={completedStages}
          variant="hero"
        />
      </div>

      <div className={styles.livesPill}>
        <div className={styles.heartRow}>
          {Array.from({ length: lives }).map((_, index) => (
            <Heart key={`overview-life-${index}`} size={18} fill="currentColor" />
          ))}
        </div>
        <p className={styles.livesText}>
          {lives} {lives === 1 ? "life" : "lives"} per stage
        </p>
      </div>

      <div className={styles.filterRow}>
        {(["All", "known", "unknown"] as CardStatusFilter[]).map((status) => {
          const label =
            status === "All" ? "All" : status === "known" ? "Known" : "Unknown"

          return (
            <button
              key={status}
              type="button"
              onClick={() => onSelectStatus(status)}
              className={`${styles.filterTab} ${
                selectedStatus === status ? styles.filterTabActive : ""
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{cardsDue}</div>
          <div className={styles.statLabel}>Cards due now</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalCards}</div>
          <div className={styles.statLabel}>All matching cards</div>
        </div>
      </div>

      <div className={styles.ctaGrid}>
        <button
          type="button"
          onClick={onStartDue}
          disabled={!cardsDue}
          className={`${styles.ctaButton} ${styles.ctaPrimary}`}
        >
          Start due words
        </button>
        <button
          type="button"
          onClick={onRepeatAll}
          disabled={!totalCards}
          className={`${styles.ctaButton} ${styles.ctaSecondary}`}
        >
          Repeat all words
        </button>
      </div>
    </section>
  )
}

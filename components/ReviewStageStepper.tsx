"use client"

import { Check, HelpCircle, Layers3, Lock, PenLine } from "lucide-react"

import styles from "@/components/review-session.module.css"

interface ReviewStageStepperProps {
  items: Array<{
    value: string
    label: string
  }>
  currentStage: string
  completedValues: string[]
  variant?: "hero" | "compact"
}

const STAGE_ICONS: Record<string, typeof Layers3> = {
  flip: Layers3,
  quiz: HelpCircle,
  write: PenLine
}

export function ReviewStageStepper({
  items,
  currentStage,
  completedValues,
  variant = "hero"
}: ReviewStageStepperProps) {
  const currentIndex = items.findIndex((item) => item.value === currentStage)

  return (
    <div className={styles.stageStepper}>
      <div className={`hide-scrollbar native-scroll ${styles.stageScrollFrame}`}>
        <div
          className={`${styles.stageTrack} ${
            variant === "hero" ? styles.stageTrackHero : styles.stageTrackCompact
          }`}
        >
          {items.map((item, index) => {
            const isCompleted = completedValues.includes(item.value)
            const isCurrent = currentIndex === index
            const isLocked = !isCompleted && currentIndex >= 0 && index > currentIndex
            const StageIcon = STAGE_ICONS[item.value]
            const glyph = isCompleted ? (
              <Check size={variant === "hero" ? 30 : 24} strokeWidth={2.8} aria-hidden="true" />
            ) : isLocked ? (
              <Lock size={variant === "hero" ? 28 : 22} strokeWidth={2.3} aria-hidden="true" />
            ) : (
              <StageIcon
                size={variant === "hero" ? 28 : 22}
                strokeWidth={2.2}
                aria-hidden="true"
              />
            )

            return (
              <div
                key={item.value}
                className={styles.stageEntry}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div
                  className={styles.stageNode}
                  data-state={
                    isCompleted ? "completed" : isCurrent ? "current" : isLocked ? "locked" : "upcoming"
                  }
                >
                  <div
                    className={`${styles.stageCircleWrap} ${
                      variant === "hero"
                        ? styles.stageCircleWrapHero
                        : styles.stageCircleWrapCompact
                    }`}
                  >
                    {isCurrent && !isCompleted ? <span className={styles.stagePulse} /> : null}
                    <div
                      className={`${styles.stageCircle} ${
                        variant === "hero" ? styles.stageCircleHero : styles.stageCircleCompact
                      } ${isCompleted ? styles.stageCompleted : ""} ${
                        !isCompleted && isCurrent ? styles.stageCurrent : ""
                      } ${isLocked ? styles.stageLocked : ""}`}
                      aria-current={isCurrent && !isCompleted ? "step" : undefined}
                    >
                      {isCompleted ? <span className={styles.stageSweep} aria-hidden="true" /> : null}
                      <span
                        className={`${styles.stageGlyph} ${
                          variant === "hero" ? styles.stageGlyphHero : styles.stageGlyphCompact
                        }`}
                      >
                        {glyph}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`${styles.stageLabel} ${
                      isCurrent && !isCompleted ? styles.stageLabelCurrent : ""
                    } ${isLocked ? styles.stageLabelLocked : ""}`}
                  >
                    {item.label}
                  </span>
                </div>
                {index < items.length - 1 ? (
                  <div
                    className={`${styles.stageConnector} ${
                      variant === "hero"
                        ? styles.stageConnectorHero
                        : styles.stageConnectorCompact
                    }`}
                    aria-hidden="true"
                  >
                    <div
                      className={styles.stageConnectorFill}
                      style={{ width: completedValues.includes(item.value) ? "100%" : "0%" }}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

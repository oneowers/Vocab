"use client"

import { Check, HelpCircle, Layers3, Lock, PenLine, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
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
  write: PenLine,
  challenge: Sparkles
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
      <div className={styles.stageTrack}>
        {items.map((item, index) => {
          const isCompleted = completedValues.includes(item.value)
          const isCurrent = currentIndex === index
          const isLocked = !isCompleted && currentIndex >= 0 && index > currentIndex
          const StageIcon = STAGE_ICONS[item.value]
          
          const glyph = isCompleted ? (
            <Check size={18} strokeWidth={3} />
          ) : isLocked ? (
            <Lock size={16} strokeWidth={2.5} />
          ) : (
            <StageIcon size={18} strokeWidth={2.4} />
          )

          return (
            <div key={item.value} className="flex items-start">
              <div className={styles.stageEntry} style={{ animationDelay: `${index * 100}ms` }}>
                <div className={styles.stageNode}>
                  <div className={styles.stageCircleWrap}>
                    {isCurrent && !isCompleted && <span className={styles.stagePulse} />}
                    <div
                      className={`${styles.stageCircle} ${
                        isCompleted ? styles.stageCompleted : isCurrent ? styles.stageCurrent : ""
                      }`}
                    >
                      <span className={styles.stageGlyph}>{glyph}</span>
                    </div>
                  </div>
                  <span
                    className={`${styles.stageLabel} ${
                      isCurrent && !isCompleted ? styles.stageLabelCurrent : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
              
              {index < items.length - 1 && (
                <div className={styles.stageConnector}>
                  <div
                    className={styles.stageConnectorFill}
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

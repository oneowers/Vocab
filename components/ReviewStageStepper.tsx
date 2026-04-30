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
    <div className={variant === "hero" ? "w-full" : styles.stageStepper}>
      <div className="flex items-center justify-between gap-1">
        {items.map((item, index) => {
          const isCompleted = completedValues.includes(item.value)
          const isCurrent = currentIndex === index
          const isLocked = !isCompleted && index > currentIndex
          const StageIcon = STAGE_ICONS[item.value]
          
          return (
            <div key={item.value} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  isCompleted 
                    ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                    : isCurrent 
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110" 
                      : "bg-white/[0.05] text-white/20 border border-white/10"
                }`}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : isLocked ? (
                  <Lock size={14} strokeWidth={2.5} />
                ) : (
                  <StageIcon size={18} strokeWidth={2.4} />
                )}
                {isCurrent && !isCompleted && (
                  <motion.span 
                    layoutId="pulse"
                    className="absolute inset-[-4px] rounded-full border border-white/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  isCurrent ? "text-white" : "text-white/20"
                }`}>
                  {item.label}
                </span>
                {isLocked && index === currentIndex + 1 && (
                  <span className="text-[8px] font-medium text-white/20 whitespace-nowrap">
                    Complete {items[currentIndex].label}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

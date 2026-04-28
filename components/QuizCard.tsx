"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import styles from "@/components/review-session.module.css"

export interface QuizMatchItem {
  id: string
  sourceCardId: string
  text: string
  cefrLevel?: string
}

interface QuizCardProps {
  leftItems: QuizMatchItem[]
  rightItems: QuizMatchItem[]
  batchIndex: number
  totalBatches: number
  targetCount: number
  onLifeLost: () => void
  onBatchCompleted: () => void
  onProgressChange: (count: number) => void
}

export function QuizCard({
  leftItems,
  rightItems,
  batchIndex,
  totalBatches,
  targetCount,
  onLifeLost,
  onBatchCompleted,
  onProgressChange
}: QuizCardProps) {
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null)
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null)
  const [solvedLeftIds, setSolvedLeftIds] = useState<string[]>([])
  const [solvedRightIds, setSolvedRightIds] = useState<string[]>([])
  const [rejectedIds, setRejectedIds] = useState<string[]>([])
  const [resolving, setResolving] = useState(false)

  function clearActiveQuizFocus() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  useEffect(() => {
    setSelectedLeftId(null)
    setSelectedRightId(null)
    setSolvedLeftIds([])
    setSolvedRightIds([])
    setRejectedIds([])
    setResolving(false)
  }, [batchIndex])

  function handleMatch(leftId: string, rightId: string) {
    const leftItem = leftItems.find((item) => item.id === leftId)
    const rightItem = rightItems.find((item) => item.id === rightId)

    if (leftItem && rightItem && leftItem.sourceCardId === rightItem.sourceCardId) {
      const nextSolvedCount = solvedLeftIds.length + 1
      clearActiveQuizFocus()
      setSolvedLeftIds((current) => [...current, leftId])
      setSolvedRightIds((current) => [...current, rightId])
      setSelectedLeftId(null)
      setSelectedRightId(null)
      onProgressChange(nextSolvedCount)

      if (nextSolvedCount === targetCount) {
        window.setTimeout(() => {
          onBatchCompleted()
        }, 300)
      }
    } else {
      handleMismatch(leftId, rightId)
    }
  }

  function handleMismatch(leftId: string, rightId: string) {
    clearActiveQuizFocus()
    setResolving(true)
    setRejectedIds([leftId, rightId])

    window.setTimeout(() => {
      setResolving(false)
      setRejectedIds([])
      setSelectedLeftId(null)
      setSelectedRightId(null)
      onLifeLost()
    }, 450)
  }

  function handleSelectLeft(id: string) {
    if (resolving || solvedLeftIds.includes(id)) {
      return
    }

    if (selectedRightId) {
      handleMatch(id, selectedRightId)
      return
    }

    setSelectedLeftId((current) => (current === id ? null : id))
  }

  function handleSelectRight(id: string) {
    if (resolving || solvedRightIds.includes(id)) {
      return
    }

    if (selectedLeftId) {
      handleMatch(selectedLeftId, id)
      return
    }

    setSelectedRightId((current) => (current === id ? null : id))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="translate-card relative overflow-hidden rounded-[2rem] p-8 md:rounded-[2.5rem]"
    >
      <div className={styles.heroCardGlow} style={{ opacity: 0.05 }} />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30">Match the pairs</p>
          <h2 className="mt-1 text-[20px] font-black text-white leading-tight">
            Find {targetCount} translation{targetCount === 1 ? "" : "s"}
          </h2>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.07] px-4 py-1.5 text-[10px] font-black text-white/55">
          Batch {batchIndex + 1} of {totalBatches}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {leftItems.map((item, idx) => {
            const isSolved = solvedLeftIds.includes(item.id)
            const isSelected = selectedLeftId === item.id
            const isRejected = rejectedIds.includes(item.id)

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                type="button"
                onClick={() => handleSelectLeft(item.id)}
                disabled={resolving || isSolved}
                className={`min-h-[60px] w-full rounded-2xl border px-4 py-3 text-center text-[14px] font-bold transition-all duration-300 relative overflow-hidden flex items-center justify-center ${
                  isSolved 
                    ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-300/35 opacity-40 scale-95" 
                    : isRejected
                    ? `border-rose-500/50 bg-rose-500/12 text-rose-300 ${styles.shake}`
                    : isSelected
                    ? "border-white/28 bg-white/[0.14] text-white scale-[1.05] shadow-[0_0_30px_rgba(255,255,255,0.12)] z-10"
                    : "border-white/[0.08] bg-white/[0.08] text-white/72 hover:bg-white/[0.12] hover:text-white hover:scale-[1.02]"
                }`}
              >
                <span className="relative z-10">{item.text}</span>
                {isSelected && <motion.div layoutId="glow-left" className="absolute inset-0 bg-white/[0.08]" />}
              </motion.button>
            )
          })}
        </div>

        <div className="space-y-2">
          {rightItems.map((item, idx) => {
            const isSolved = solvedRightIds.includes(item.id)
            const isSelected = selectedRightId === item.id
            const isRejected = rejectedIds.includes(item.id)

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                type="button"
                onClick={() => handleSelectRight(item.id)}
                disabled={resolving || isSolved}
                className={`min-h-[60px] w-full rounded-2xl border px-4 py-3 text-center text-[14px] font-bold transition-all duration-300 relative overflow-hidden flex items-center justify-center ${
                  isSolved 
                    ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-300/35 opacity-40 scale-95" 
                    : isRejected
                    ? `border-rose-500/50 bg-rose-500/12 text-rose-300 ${styles.shake}`
                    : isSelected
                    ? "border-white/28 bg-white/[0.14] text-white scale-[1.05] shadow-[0_0_30px_rgba(255,255,255,0.12)] z-10"
                    : "border-white/[0.08] bg-white/[0.08] text-white/72 hover:bg-white/[0.12] hover:text-white hover:scale-[1.02]"
                }`}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <span className="leading-tight">{item.text}</span>
                  {item.cefrLevel && (
                    <span className="text-[9px] font-black text-white/35 uppercase tracking-[0.1em]">
                      {item.cefrLevel}
                    </span>
                  )}
                </div>
                {isSelected && <motion.div layoutId="glow-right" className="absolute inset-0 bg-white/[0.08]" />}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

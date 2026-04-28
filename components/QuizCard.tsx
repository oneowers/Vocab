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
  onLifeLost: () => void
  onBatchCompleted: () => void
  onProgressChange: (count: number) => void
}

export function QuizCard({
  leftItems,
  rightItems,
  batchIndex,
  totalBatches,
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
      setSolvedLeftIds((current) => [...current, leftId])
      setSolvedRightIds((current) => [...current, rightId])
      setSelectedLeftId(null)
      setSelectedRightId(null)
      onProgressChange(nextSolvedCount)

      if (nextSolvedCount === leftItems.length) {
        window.setTimeout(() => {
          onBatchCompleted()
        }, 300)
      }
    } else {
      handleMismatch(leftId, rightId)
    }
  }

  function handleMismatch(leftId: string, rightId: string) {
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
    }

    setSelectedLeftId((current) => (current === id ? null : id))
  }

  function handleSelectRight(id: string) {
    if (resolving || solvedRightIds.includes(id)) {
      return
    }

    if (selectedLeftId) {
      handleMatch(selectedLeftId, id)
    }

    setSelectedRightId((current) => (current === id ? null : id))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden border border-white/10 bg-white/[0.03] p-8 shadow-[0_18px_36px_-18px_rgba(0,0,0,0.45)] md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2rem] md:rounded-[2.5rem]`}
    >
      <div className={styles.heroCardGlow} style={{ opacity: 0.05 }} />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20">Match the pairs</p>
          <h2 className="mt-1 text-[20px] font-black text-white leading-tight">Find 4 translations</h2>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-1.5 text-[10px] font-black text-white/40 border border-white/5">
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
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400/20 opacity-30 scale-95" 
                    : isRejected
                    ? `border-rose-500/50 bg-rose-500/10 text-rose-500 ${styles.shake}`
                    : isSelected
                    ? "border-white/40 bg-white/15 text-white scale-[1.05] shadow-[0_0_30px_rgba(255,255,255,0.15)] z-10"
                    : "border-white/5 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white hover:scale-[1.02]"
                }`}
              >
                <span className="relative z-10">{item.text}</span>
                {isSelected && <motion.div layoutId="glow-left" className="absolute inset-0 bg-white/10" />}
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
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400/20 opacity-30 scale-95" 
                    : isRejected
                    ? `border-rose-500/50 bg-rose-500/10 text-rose-500 ${styles.shake}`
                    : isSelected
                    ? "border-white/40 bg-white/15 text-white scale-[1.05] shadow-[0_0_30px_rgba(255,255,255,0.15)] z-10"
                    : "border-white/5 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white hover:scale-[1.02]"
                }`}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <span className="leading-tight">{item.text}</span>
                  {item.cefrLevel && (
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em]">
                      {item.cefrLevel}
                    </span>
                  )}
                </div>
                {isSelected && <motion.div layoutId="glow-right" className="absolute inset-0 bg-white/10" />}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

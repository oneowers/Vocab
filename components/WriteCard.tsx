"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { levenshtein } from "@/lib/levenshtein"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, ReviewResult } from "@/lib/types"
import styles from "@/components/review-session.module.css"

interface WriteCardProps {
  card: CardRecord
  onResolved: (result: ReviewResult) => void
}

export function WriteCard({ card, onResolved }: WriteCardProps) {
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<ReviewResult | null>(null)

  useEffect(() => {
    setAnswer("")
    setResult(null)
  }, [card.id])

  const promptText = card.direction === "en-ru" ? card.translation : card.original
  const expectedAnswer = card.direction === "en-ru" ? card.original : card.translation
  const promptLanguage = card.direction === "en-ru" ? "ru-RU" : "en-US"

  function handleSubmit() {
    if (!answer.trim() || result) {
      return
    }

    const distance = levenshtein(answer.trim().toLowerCase(), expectedAnswer.toLowerCase())
    const isCorrect = distance <= Math.floor(expectedAnswer.length * 0.15)

    const finalResult = isCorrect ? "known" : "unknown"
    setResult(finalResult)

    window.setTimeout(() => {
      onResolved(finalResult)
    }, 1200)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2.5rem] ${result === "unknown" ? styles.shake : ""}`}
    >
      <div className={styles.heroCardGlow} style={{ opacity: 0.05 }} />
      
      <div className="relative z-10 flex items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20">Translate this</p>
          <motion.h2 
            layoutId={`word-${card.id}`}
            className="mt-1 text-[24px] font-black text-white leading-tight"
          >
            {promptText}
          </motion.h2>
        </div>
        {canSpeak() && (
          <button
            type="button"
            onClick={() => speakText(promptText, promptLanguage)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
          >
            <Sparkles size={20} className="text-blue-400/60" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative z-10">
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSubmit()
              }
            }}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            placeholder="Type your answer..."
            className={`h-16 w-full rounded-2xl border-none bg-white/[0.05] px-6 text-[18px] font-bold text-white placeholder:text-white/10 transition-all focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10 shadow-inner ${
              result === "known" ? styles.correctGlow : result === "unknown" ? styles.incorrectGlow : ""
            }`}
          />
        </div>
        
        <div className="relative z-10">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!answer.trim() || !!result}
            className={styles.glassButtonPrimary}
          >
            Check Answer
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mt-6"
          >
            <div className={`rounded-[2rem] p-6 border backdrop-blur-md shadow-lg ${
              result === "known" 
                ? "bg-emerald-500/10 border-emerald-500/20" 
                : "bg-rose-500/10 border-rose-500/20"
            }`}>
              <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${
                result === "known" ? "text-emerald-400" : "text-rose-400"
              }`}>
                {result === "known" ? "Perfect!" : "The correct word is"}
              </p>
              <div className="mt-3 flex items-baseline gap-4">
                <p className="text-[26px] font-black text-white leading-tight">{expectedAnswer}</p>
                {card.phonetic && (
                  <p className="text-[15px] font-medium text-white/20 tracking-wider">{card.phonetic}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

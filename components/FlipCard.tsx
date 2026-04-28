"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, ReviewResult } from "@/lib/types"
import styles from "@/components/review-session.module.css"

interface FlipCardProps {
  card: CardRecord
  onAnswer: (result: ReviewResult) => void
}

const CEFR_STYLES: Record<string, { dot: string; text: string }> = {
  A1: { dot: "bg-emerald-400", text: "text-emerald-400" },
  A2: { dot: "bg-emerald-500", text: "text-emerald-500" },
  B1: { dot: "bg-blue-400", text: "text-blue-400" },
  B2: { dot: "bg-blue-500", text: "text-blue-500" },
  C1: { dot: "bg-purple-400", text: "text-purple-400" },
  C2: { dot: "bg-purple-500", text: "text-purple-500" }
}

export function FlipCard({ card, onAnswer }: FlipCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    setRevealed(false)
    setShaking(false)
  }, [card.id])

  function handleAnswer(result: ReviewResult) {
    if (result === "unknown") {
      setShaking(true)
      window.setTimeout(() => setShaking(false), 500)
    }
    onAnswer(result)
  }

  const promptLanguage = card.direction === "en-ru" ? "en-US" : "ru-RU"
  const answerLanguage = card.direction === "en-ru" ? "ru-RU" : "en-US"

  return (
    <motion.div 
      layout
      className={`relative overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-8 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2.5rem] ${shaking ? styles.shake : ""}`}
      style={{ minHeight: "320px", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      <div className={styles.heroCardGlow} style={{ opacity: revealed ? 0.15 : 0.05, transition: "opacity 0.5s ease" }} />
      
      <div className="relative z-10 space-y-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20 mb-2">Original Word</p>
        <h2 className="text-[32px] font-black tracking-tight text-white leading-tight mb-2">
          {card.original}
        </h2>
        {card.cefrLevel && (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-white/40 border border-white/5 backdrop-blur-md">
              <span className={`h-1.5 w-1.5 rounded-full ${CEFR_STYLES[card.cefrLevel].dot} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
              {card.cefrLevel}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div 
            key="hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.2 }}
            className="mt-8 relative z-10"
          >
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className={styles.glassButtonPrimary}
            >
              Reveal Translation
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="revealed"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mt-8 space-y-6 relative z-10"
          >
            <div className="rounded-3xl bg-white/[0.04] p-6 border border-white/5 shadow-inner">
              <div className="flex items-center justify-center gap-4">
                <h3 className="text-[32px] font-black tracking-tight text-white leading-tight">
                  {card.translation}
                </h3>
                {canSpeak() && (
                  <button
                    type="button"
                    onClick={() => speakText(card.translation, answerLanguage)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
                  >
                    <Sparkles size={18} className="text-blue-400/60" />
                  </button>
                )}
              </div>
              {card.phonetic && (
                <p className="mt-2 text-[14px] font-medium text-white/30 tracking-wider">
                  {card.phonetic}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleAnswer("unknown")}
                className={`${styles.glassButtonSecondary} !border-rose-500/20 text-rose-400 hover:!bg-rose-500/10 hover:!border-rose-500/40`}
              >
                Forgot
              </button>
              <button
                type="button"
                onClick={() => handleAnswer("known")}
                className={styles.glassButtonPrimary}
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

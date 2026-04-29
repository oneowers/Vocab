"use client"

import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { trackEvent } from "@/lib/analytics"

import { useToast } from "@/components/Toast"
import type { CardRecord, PracticeWritingChallengeResult } from "@/lib/types"
import styles from "@/components/review-session.module.css"

interface PracticeWritingChallengeProps {
  targetCards: CardRecord[]
  onSkip: () => void
}

export function PracticeWritingChallenge({
  targetCards,
  onSkip
}: PracticeWritingChallengeProps) {
  const { showToast } = useToast()
  const [userText, setUserText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PracticeWritingChallengeResult | null>(null)

  useEffect(() => {
    trackEvent("ai_challenge_started")
  }, [])

  async function handleSubmit() {
    if (!userText.trim()) {
      showToast("Write a short English text first.", "error")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/practice/writing-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cardIds: targetCards.map((card) => card.id),
          userText: userText.trim()
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not check your writing.")
      }

      const payload = (await response.json()) as {
        result: PracticeWritingChallengeResult
      }
      setResult(payload.result)
      trackEvent("ai_challenge_completed")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not check your writing.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden border border-white/10 bg-white/[0.03] p-8 shadow-[0_18px_36px_-18px_rgba(0,0,0,0.45)] md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2rem] md:rounded-[2.5rem]"
      >
        <div className={styles.heroCardGlow} style={{ opacity: 0.1 }} />
        
        <div className="relative z-10 flex items-center gap-4 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30">AI feedback</p>
            <h2 className="mt-1 text-[24px] font-black text-white leading-tight">Score: {result.score}/100</h2>
          </div>
        </div>

        <div className="relative z-10 mt-5 space-y-6">
          <div className="rounded-3xl bg-white/[0.04] p-6 border border-white/5 shadow-inner">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30 mb-2">Feedback</p>
            <p className="text-[15px] leading-relaxed text-white/80 font-medium">{result.levelFeedback}</p>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30 mb-3">Target words</p>
            <div className="space-y-2">
              {result.usedWords.map((item) => (
                <div
                  key={item.word}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[16px] font-bold text-white">{item.word}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      item.used 
                        ? item.correct ? "bg-emerald-500/20 text-emerald-300" : "bg-warning-soft text-warning" 
                        : "bg-white/10 text-white/50"
                    }`}>
                      {item.used ? (item.correct ? "Used well" : "Has issues") : "Not used"}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-white/60">{item.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {result.whatWasGood && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30 mb-2">What was good</p>
              <p className="text-[15px] leading-relaxed text-white/80">{result.whatWasGood}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30 mb-3">Grammar</p>
            {result.grammarMistakes.length ? (
              <div className="space-y-2">
                {result.grammarMistakes.map((mistake, index) => (
                  <div
                    key={`${mistake.original}-${index}`}
                    className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-5 py-4"
                  >
                    <p className="text-[14px] font-medium text-rose-300/80 line-through decoration-rose-500/50">{mistake.original}</p>
                    <p className="mt-1 text-[16px] font-bold text-emerald-400">{mistake.corrected}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                      {mistake.explanationRu}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-white/80">
                Грубых грамматических ошибок AI не нашёл.
              </p>
            )}
          </div>

          {result.improvedText && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30 mb-2">Improved version</p>
              <div className="rounded-3xl bg-blue-500/5 border border-blue-500/20 p-6 shadow-inner">
                 <p className="text-[15px] leading-relaxed text-blue-100 font-medium">
                  {result.improvedText}
                 </p>
              </div>
            </div>
          )}

          {result.nextTask && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30 mb-2">Next task</p>
              <p className="text-[15px] leading-relaxed text-white/80">{result.nextTask}</p>
            </div>
          )}
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
          <button type="button" onClick={onSkip} className={styles.glassButtonPrimary}>
            Finish Session
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden border border-white/10 bg-white/[0.03] p-8 shadow-[0_18px_36px_-18px_rgba(0,0,0,0.45)] md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2rem] md:rounded-[2.5rem]"
    >
      <div className={styles.heroCardGlow} style={{ opacity: 0.05 }} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-blue-400" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30">AI Challenge</p>
          </div>
          <h2 className="text-[28px] font-black text-white leading-tight">Use these words</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/60 max-w-[280px]">
            Write a short text. AI will check words, grammar, and naturalness.
          </p>
        </div>
        <button type="button" onClick={onSkip} className={`${styles.glassButtonSecondary} !w-auto !h-10 px-6 shrink-0`}>
          Skip
        </button>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap gap-2 mb-6">
        {targetCards.map((card) => (
          <span
            key={card.id}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-bold text-white shadow-inner"
          >
            {card.original}
          </span>
        ))}
      </div>

      <div className="relative z-10">
        <textarea
          value={userText}
          onChange={(event) => setUserText(event.target.value)}
          placeholder="Write 3–6 sentences using today's words..."
          className="min-h-[200px] w-full resize-y rounded-3xl border border-white/10 bg-black/40 px-6 py-5 text-[16px] leading-relaxed text-white placeholder:text-white/20 focus:border-white/30 focus:bg-black/60 focus:outline-none transition-all duration-300 shadow-inner"
        />
      </div>

      <div className="relative z-10 mt-6">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className={styles.glassButtonPrimary}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Checking...
            </>
          ) : (
            "Check my text"
          )}
        </button>
      </div>
    </motion.div>
  )
}

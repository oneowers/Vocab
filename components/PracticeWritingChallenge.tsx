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

function getGrammarFindingSeverityClass(severity: PracticeWritingChallengeResult["grammarFindings"][number]["severity"]) {
  if (severity === "high") {
    return "bg-rose-500/10 text-rose-500 border border-rose-500/20"
  }

  if (severity === "medium") {
    return "bg-rose-500/5 text-rose-500 border border-rose-500/10"
  }

  return "bg-amber-500/10 text-amber-500 border border-amber-500/20"
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
        className="relative overflow-hidden border border-white/[0.05] bg-[#1C1C1E] p-8 shadow-2xl rounded-[32px]"
      >
        <div 
          className={styles.heroCardGlow} 
          style={{ 
            opacity: 0.12,
            background: "radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.08) 40%, transparent 70%)"
          }} 
        />
        
        <div className="relative z-10 flex items-center gap-4 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">AI feedback</p>
            <h2 className="mt-1 text-[24px] font-black text-ink leading-tight">Score: {result.score}/100</h2>
          </div>
        </div>

        <div className="relative z-10 mt-5 space-y-6">
          <div className="rounded-[24px] bg-white/[0.03] p-6 border border-white/[0.05]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Feedback</p>
            <p className="text-[15px] leading-relaxed text-white/90 font-medium">{result.levelFeedback}</p>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted mb-3">Target words</p>
            <div className="space-y-3">
              {result.usedWords.map((item) => (
                <div
                  key={item.word}
                  className="rounded-[20px] border border-white/[0.05] bg-white/[0.02] px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[16px] font-bold text-white">{item.word}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      item.used 
                        ? item.correct ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400" 
                        : "bg-white/5 text-white/40"
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
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted mb-2">What was good</p>
              <p className="text-[15px] leading-relaxed text-ink/80">{result.whatWasGood}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted mb-3">Grammar</p>
            {result.grammarMistakes.length ? (
              <div className="space-y-2">
                {result.grammarMistakes.map((mistake, index) => (
                  <div
                    key={`${mistake.original}-${index}`}
                    className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-5 py-4"
                  >
                    <p className="text-[14px] font-medium text-rose-500/80 line-through decoration-rose-500/50">{mistake.original}</p>
                    <p className="mt-1 text-[16px] font-bold text-emerald-600">{mistake.corrected}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">
                      {mistake.explanationRu}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-ink/80">
                Грубых грамматических ошибок AI не нашёл.
              </p>
            )}
          </div>

          {result.grammarFindings.length ? (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30 mb-3">Tracked grammar skills</p>
              <div className="space-y-2">
                {result.grammarFindings.map((finding) => (
                  <div
                    key={`${finding.topicKey}-${finding.original}-${finding.corrected}`}
                    className="rounded-2xl border border-line bg-bg-tertiary px-5 py-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-ink">{finding.topicKey.replaceAll("_", " ")}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getGrammarFindingSeverityClass(finding.severity)}`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-rose-500/80 line-through decoration-rose-500/50">
                      {finding.original}
                    </p>
                    <p className="mt-1 text-[15px] font-bold text-emerald-600">{finding.corrected}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">
                      {finding.explanationRu}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result.improvedText && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted mb-2">Improved version</p>
              <div className="rounded-3xl bg-emerald-500/5 border border-emerald-500/20 p-6 shadow-inner">
                 <p className="text-[15px] leading-relaxed text-emerald-700 dark:text-emerald-100 font-medium">
                  {result.improvedText}
                 </p>
              </div>
            </div>
          )}

          {result.nextTask && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted mb-2">Next task</p>
              <p className="text-[15px] leading-relaxed text-ink/80">{result.nextTask}</p>
            </div>
          )}
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-line">
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
        className="relative overflow-hidden border border-white/[0.05] bg-[#1C1C1E] p-8 shadow-2xl rounded-[32px]"
      >
      <div className={styles.heroCardGlow} style={{ opacity: 0.05 }} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-blue-400" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">AI Challenge</p>
          </div>
          <h2 className="text-[28px] font-black text-ink leading-tight">Use these words</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted max-w-[280px]">
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
            className="rounded-full border border-white/[0.05] bg-white/[0.03] px-4 py-2 text-[13px] font-bold text-white shadow-sm"
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
          className="min-h-[200px] w-full resize-y rounded-[24px] border border-white/[0.05] bg-black/20 px-6 py-5 text-[16px] leading-relaxed text-white placeholder:text-white/20 focus:border-[#0A84FF]/50 focus:bg-black/30 focus:outline-none transition-all duration-300 shadow-inner"
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

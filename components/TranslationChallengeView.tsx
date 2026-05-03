"use client"

import { ArrowRight, CheckCircle2, Loader2, Sparkles, RefreshCw, Languages } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { trackEvent } from "@/lib/analytics"
import { useToast } from "@/components/Toast"
import styles from "@/components/review-session.module.css"

interface TranslationChallengeViewProps {
  onBack: () => void
}

export function TranslationChallengeView({ onBack }: TranslationChallengeViewProps) {
  const { showToast } = useToast()
  const [loadingTask, setLoadingTask] = useState(true)
  const [russianText, setRussianText] = useState("")
  const [suggestedWords, setSuggestedWords] = useState<string[]>([])
  const [userTranslation, setUserTranslation] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  useEffect(() => {
    generateTask()
    trackEvent("translation_challenge_started")
  }, [])

  async function generateTask() {
    setLoadingTask(true)
    setResult(null)
    setUserTranslation("")
    try {
      const res = await fetch("/api/practice/translation-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate task")
      setRussianText(data.russianText)
      setSuggestedWords(data.suggestedWords || [])
    } catch (err: any) {
      showToast(err.message || "Error generating task", "error")
    } finally {
      setLoadingTask(false)
    }
  }

  async function handleSubmit() {
    if (!userTranslation.trim()) {
      showToast("Please enter your translation", "error")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/practice/translation-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check",
          russianText,
          userTranslation
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to check translation")
      setResult(data)
      trackEvent("translation_challenge_completed")
    } catch (err) {
      showToast("Error checking translation", "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingTask) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-muted font-medium">Generating translation task...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="task"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="panel p-6 border-line bg-bg-secondary rounded-[2rem] shadow-modal relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button onClick={generateTask} className="text-quiet hover:text-ink transition-colors">
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Languages className="text-blue-500" size={20} />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">Translate to English</span>
              </div>
              <p className="text-[20px] font-bold text-ink leading-relaxed">
                {russianText}
              </p>
              
              {suggestedWords.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestedWords.map(word => (
                    <span key={word} className="px-2 py-1 rounded-lg bg-bg-tertiary text-[12px] font-semibold text-muted border border-line">
                      {word}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              placeholder="Your English translation..."
              className="w-full min-h-[150px] p-6 rounded-[2rem] bg-bg-tertiary border-line text-ink placeholder:text-muted focus:border-blue-500/50 outline-none transition-all shadow-inner text-[16px] leading-relaxed"
            />

            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="flex-1 h-14 rounded-2xl border border-line text-muted font-bold hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-[2] h-14 rounded-2xl bg-ink text-bg-primary font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Check Translation</>}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 pb-20"
          >
            <div className="panel p-8 border-line bg-bg-secondary rounded-[2.5rem] shadow-modal relative overflow-hidden">
               <div className="flex items-center gap-4 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">AI Review</p>
                  <h2 className="text-[24px] font-black text-ink">Score: {result.score}/100</h2>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl bg-bg-tertiary p-6 border border-line">
                   <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted mb-2">Original</p>
                   <p className="text-ink font-medium">{russianText}</p>
                </div>

                <div className="rounded-3xl bg-bg-tertiary p-6 border border-line">
                   <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted mb-2">Your Translation</p>
                   <p className="text-ink font-medium">{userTranslation}</p>
                </div>

                <div className="rounded-3xl bg-emerald-500/5 p-6 border border-emerald-500/20">
                   <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600 mb-2">Best Version</p>
                   <p className="text-emerald-700 dark:text-emerald-300 font-bold">{result.correctedEnglishText}</p>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">Feedback</p>
                   <p className="text-ink leading-relaxed">{result.feedbackRu}</p>
                </div>

                {result.mistakes.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">Mistakes</p>
                    <div className="space-y-3">
                      {result.mistakes.map((m: any, i: number) => (
                        <div key={i} className="p-4 rounded-2xl border border-rose-500/10 bg-rose-500/5">
                           <p className="text-[14px] text-rose-500 line-through opacity-60">{m.original}</p>
                           <p className="text-[16px] font-bold text-emerald-600 my-1">{m.corrected}</p>
                           <p className="text-[13px] text-muted">{m.explanationRu}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={generateTask}
                className="mt-8 w-full h-14 rounded-2xl bg-ink text-bg-primary font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
              >
                Try Another One
                <ArrowRight size={20} />
              </button>
              
              <button
                onClick={onBack}
                className="mt-3 w-full h-12 text-muted font-bold hover:text-ink transition-colors"
              >
                Back to Practice
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

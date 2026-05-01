"use client"

import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { WritingExercise } from "@/lib/grammar-content"
import { useToast } from "./Toast"

interface GrammarWritingExerciseViewProps {
  exercise: WritingExercise
  onComplete: (scoreDelta: number) => void
}

export function GrammarWritingExerciseView({ exercise, onComplete }: GrammarWritingExerciseViewProps) {
  const { showToast } = useToast()
  const [userText, setUserText] = useState("")
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)

  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length

  const handleCheck = async () => {
    if (wordCount < exercise.minWords) {
      showToast(`Напиши минимум ${exercise.minWords} слов.`, "error")
      return
    }

    setChecking(true)
    try {
      const response = await fetch("/api/practice/grammar-challenge/check-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicKey: exercise.topicKey,
          userText,
          prompt: exercise.prompt
        })
      })

      if (!response.ok) throw new Error()
      const data = await response.json()
      setFeedback(data.feedback)
    } catch (error) {
      showToast("Не удалось проверить текст. Попробуй ещё раз.", "error")
    } finally {
      setChecking(false)
    }
  }

  if (feedback) {
    return (
      <div className="space-y-8">
        <header className="text-center">
           <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">
            <span className="text-[24px] font-black">{feedback.score}</span>
          </div>
          <p className="text-[15px] font-medium text-white/80 leading-relaxed italic">
            "{feedback.summaryRu}"
          </p>
        </header>

        <div className="space-y-4">
          {feedback.mistakes.map((mistake: any, i: number) => (
            <div key={i} className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
              <p className="text-[14px] font-medium text-rose-300/60 line-through decoration-rose-500/40">
                {mistake.original}
              </p>
              <p className="mt-1 text-[16px] font-bold text-emerald-400">
                {mistake.corrected}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/60">
                {mistake.explanationRu}
              </p>
            </div>
          ))}

          {feedback.correctFragments.map((frag: any, i: number) => (
            <div key={i} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-[15px] font-bold text-emerald-400">
                {frag.text}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                {frag.reasonRu}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            const totalDelta = feedback.score >= 70 ? 3 : -5 // Example logic
            onComplete(totalDelta)
          }}
          className="h-14 w-full rounded-2xl bg-white text-black text-[16px] font-black hover:bg-white/90 transition-all active:scale-[0.98]"
        >
          Complete Lesson
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-[17px] font-bold text-white leading-relaxed">
          {exercise.prompt}
        </h3>
      </div>

      <div className="relative">
        <textarea
          value={userText}
          onChange={e => setUserText(e.target.value)}
          placeholder="Type your sentences here..."
          className="h-48 w-full resize-none rounded-3xl border border-white/10 bg-white/5 p-6 text-[17px] font-bold outline-none focus:border-white/20"
          autoFocus
        />
        <div className="absolute bottom-4 right-6 text-[12px] font-bold text-white/30">
          {wordCount} / {exercise.minWords} words
        </div>
      </div>

      <button
        disabled={checking || wordCount < exercise.minWords}
        onClick={handleCheck}
        className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-black transition-all active:scale-[0.98] ${
          checking || wordCount < exercise.minWords
            ? "bg-white/5 text-white/20"
            : "bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/10"
        }`}
      >
        {checking ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            Check Grammar
            <Sparkles size={18} />
          </>
        )}
      </button>
    </div>
  )
}

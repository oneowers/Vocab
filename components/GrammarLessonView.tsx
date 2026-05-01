"use client"

import { ArrowLeft, Check, ChevronRight, HelpCircle, Loader2, Sparkles, X } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GRAMMAR_TOPICS, type GrammarExercise } from "@/lib/grammar-content"
import { useToast } from "./Toast"
import { GrammarExerciseRunner } from "./GrammarExerciseRunner"

interface GrammarLessonViewProps {
  topicKey: string
  onBack: () => void
}

export function GrammarLessonView({ topicKey, onBack }: GrammarLessonViewProps) {
  const topic = GRAMMAR_TOPICS[topicKey]
  const [step, setStep] = useState<"THEORY" | "EXERCISES" | "COMPLETE">("THEORY")
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)

  if (!topic) return null

  if (step === "EXERCISES") {
    return (
      <GrammarExerciseRunner 
        topic={topic}
        onComplete={() => setStep("COMPLETE")}
        onBack={() => setStep("THEORY")}
      />
    )
  }

  if (step === "COMPLETE") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c10] px-4 py-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
        >
          <Check size={48} strokeWidth={3} />
        </motion.div>
        <h1 className="text-[32px] font-black text-white">Topic Completed!</h1>
        <p className="mt-4 text-[16px] text-white/50 leading-relaxed max-w-xs">
          You've completed the {topic.titleEn} lesson and exercises. Your skills have been updated!
        </p>
        <button
          onClick={onBack}
          className="mt-12 w-full max-w-xs h-14 rounded-2xl bg-white text-black text-[16px] font-black hover:bg-white/90 transition-all active:scale-[0.98]"
        >
          Finish Lesson
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0c10]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#0a0c10]/80 px-4 py-4 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Grammar Lesson</span>
          <h2 className="text-[15px] font-bold text-white">{topic.titleEn}</h2>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8 pb-32">
        <div className="mx-auto max-w-xl space-y-10">
          {/* Summary */}
          <section>
            <p className="text-[18px] font-medium leading-relaxed text-white/80">
              {topic.descriptionRu}
            </p>
          </section>

          {/* Formulas */}
          <section className="space-y-4">
            <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-white/30">Formulas</h3>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-emerald-400">Positive (+)</span>
                <p className="text-[16px] font-mono font-bold text-white">{topic.formulas.positive}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-rose-400">Negative (-)</span>
                <p className="text-[16px] font-mono font-bold text-white">{topic.formulas.negative}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-amber-400">Question (?)</span>
                <p className="text-[16px] font-mono font-bold text-white">{topic.formulas.question}</p>
              </div>
            </div>
          </section>

          {/* Usage Cases */}
          <section className="space-y-4">
            <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-white/30">Usage</h3>
            <div className="space-y-2">
              {topic.usage.map((use, i) => (
                <div key={i} className="flex items-start gap-3 text-[15px] text-white/70">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span>{use}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Examples */}
          <section className="space-y-4">
            <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-white/30">Examples</h3>
            <div className="grid gap-3">
              {topic.examples.map((ex, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-[16px] font-bold text-white">{ex.en}</p>
                  <p className="mt-1 text-[13px] text-white/40">{ex.ru}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Common Mistakes */}
          <section className="space-y-4">
            <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-white/30">Common Mistakes</h3>
            <div className="grid gap-4">
              {topic.commonMistakes.map((mistake, i) => (
                <div key={i} className="rounded-[2rem] border border-rose-500/10 bg-rose-500/[0.02] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                      <X size={14} strokeWidth={3} />
                    </div>
                    <span className="text-[15px] font-bold text-rose-300 line-through decoration-rose-500/30">
                      {mistake.wrong}
                    </span>
                  </div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-[16px] font-black text-emerald-400">
                      {mistake.correct}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-white/60">
                    {mistake.explanationRu}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-[#0a0c10]/90 p-5 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-xl">
          <button
            onClick={() => setStep("EXERCISES")}
            className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-black text-[16px] font-black transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Practice Topic
            <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </footer>
    </div>
  )
}

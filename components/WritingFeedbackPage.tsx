"use client"

import { Sparkles, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarWritingFeedback } from "@/lib/types"
import { GrammarMistakeCard } from "./GrammarMistakeCard"
import { WordUsageFeedback } from "./WordUsageFeedback"

interface WritingFeedbackPageProps {
  feedback: GrammarWritingFeedback
  onNewTask: () => void
  onFinish: () => void
}

export function WritingFeedbackPage({ feedback, onNewTask, onFinish }: WritingFeedbackPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl px-4 py-8 pb-32"
    >
      <header className="mb-10 flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
           <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-white/5"
              />
              <circle
                cx="56"
                cy="56"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={326}
                strokeDashoffset={326 - (326 * feedback.score) / 100}
                className="text-purple-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-[32px] font-black text-white leading-none">{feedback.score}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Score</span>
            </div>
        </div>
        
        <h1 className="text-[28px] font-black text-white">Excellent Work!</h1>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-purple-500/20 px-4 py-1.5 text-[12px] font-bold text-purple-400 border border-purple-500/20">
            {feedback.cefrLevel} Level
          </span>
        </div>
        <p className="mt-8 text-[16px] leading-relaxed text-white/80 font-medium italic">
          "{feedback.summaryRu}"
        </p>
      </header>

      <div className="space-y-10">
        {/* Mistakes Section */}
        <section>
          <h3 className="mb-5 text-[12px] font-extrabold uppercase tracking-widest text-white/30">
            Mistakes & Improvements
          </h3>
          <div className="space-y-4">
            {feedback.mistakes.map((mistake, i) => (
              <GrammarMistakeCard key={i} mistake={mistake} />
            ))}
            {feedback.mistakes.length === 0 && (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center italic text-white/40">
                Perfect grammar! No mistakes detected.
              </div>
            )}
          </div>
        </section>

        {/* Word Usage */}
        <WordUsageFeedback wordUsage={feedback.wordUsage} />

        {/* Correct Fragments */}
        <section>
          <h3 className="mb-5 text-[12px] font-extrabold uppercase tracking-widest text-white/30">
            What you did well
          </h3>
          <div className="space-y-4">
            {feedback.correctFragments.map((frag, i) => (
              <div key={i} className="rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.03] p-6 transition-all hover:bg-emerald-500/[0.05]">
                <p className="text-[17px] font-bold text-emerald-400">
                  {frag.text}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-white/60">
                  {frag.reasonRu}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Next Suggestion */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-600/20 to-indigo-600/20 p-10 text-center border border-purple-500/20 shadow-2xl">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
          <Sparkles size={32} className="mx-auto mb-5 text-purple-400" />
          <h3 className="text-[20px] font-black text-white">Coach Recommendation</h3>
          <p className="mt-3 text-[16px] leading-relaxed text-white/90 font-medium">
            {feedback.nextSuggestionRu}
          </p>
        </section>
      </div>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-[#0a0c10]/90 p-5 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-xl gap-4">
          <button
            onClick={onNewTask}
            className="flex-1 h-14 rounded-2xl bg-white/5 text-[16px] font-bold text-white hover:bg-white/10 transition-all border border-white/10 active:scale-[0.98]"
          >
            New Task
          </button>
          <button
            onClick={onFinish}
            className="flex-[1.5] h-14 rounded-2xl bg-white text-black text-[16px] font-black hover:bg-white/90 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Finish Practice
            <ArrowRight size={20} />
          </button>
        </div>
      </footer>
    </motion.div>
  )
}

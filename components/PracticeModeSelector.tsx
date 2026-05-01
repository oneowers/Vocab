"use client"

import { BookOpen, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface PracticeModeSelectorProps {
  onSelectWords: () => void
  onSelectGrammar: () => void
  dueCount: number
  weakGrammarCount: number
}

export function PracticeModeSelector({
  onSelectWords,
  onSelectGrammar,
  dueCount,
  weakGrammarCount
}: PracticeModeSelectorProps) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 md:py-12">
      <header className="mb-10 text-center">
        <h1 className="text-[32px] font-black tracking-tight text-white md:text-[40px]">
          Practice Center
        </h1>
        <p className="mt-2 text-[16px] font-medium text-white/40">
          Choose what you want to improve today
        </p>
      </header>

      <div className="grid gap-4 md:gap-6">
        <button
          type="button"
          onClick={onSelectWords}
          className="group relative flex flex-col items-start overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-left transition-all hover:bg-white/[0.06] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] active:scale-[0.98]"
        >
          <span className="absolute right-0 top-0 -mr-4 -mt-4 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-colors group-hover:bg-blue-500/20" />
          
          <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BookOpen size={28} strokeWidth={2.5} />
          </span>

          <span>
            <h2 className="text-[24px] font-black text-white">Learn Words</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/50">
              Practice your saved vocabulary cards through flips, quizzes, and writing.
            </p>
          </span>

          <span className="mt-8 flex items-center gap-3">
            <span className="flex h-8 items-center rounded-full bg-blue-500/20 px-4 text-[12px] font-bold text-blue-300 border border-blue-500/20">
              {dueCount} {dueCount === 1 ? "word" : "words"} due
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectGrammar}
          className="group relative flex flex-col items-start overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-left transition-all hover:bg-white/[0.06] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] active:scale-[0.98]"
        >
          <span className="absolute right-0 top-0 -mr-4 -mt-4 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl transition-colors group-hover:bg-purple-500/20" />

          <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles size={28} strokeWidth={2.5} />
          </span>

          <span>
            <h2 className="text-[24px] font-black text-white">Learn Grammar</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/50">
              Improve weak grammar areas through short writing tasks and get AI feedback.
            </p>
          </span>

          <span className="mt-8 flex items-center gap-3">
            <span className="flex h-8 items-center rounded-full bg-purple-500/20 px-4 text-[12px] font-bold text-purple-300 border border-purple-500/20">
              {weakGrammarCount} weak {weakGrammarCount === 1 ? "topic" : "topics"}
            </span>
            {weakGrammarCount > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

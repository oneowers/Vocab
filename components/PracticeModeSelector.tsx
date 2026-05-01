"use client"

import { BookOpen, Sparkles, PenTool, Target, ChevronRight } from "lucide-react"
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
    <div className="mx-auto max-w-xl px-4 pb-32 pt-6 md:pt-12">
      {/* Compact Header */}
      <header className="mb-6 px-1">
        <h1 className="text-[28px] font-black tracking-tight text-white md:text-[36px]">
          Practice
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-bold text-white/30">
          <span className={dueCount > 0 ? "text-blue-400" : ""}>
            {dueCount} {dueCount === 1 ? "word" : "words"} due
          </span>
          <span className="h-1 w-1 rounded-full bg-white/10" />
          <span className={weakGrammarCount > 0 ? "text-purple-400" : ""}>
            {weakGrammarCount} {weakGrammarCount === 1 ? "weak topic" : "weak topics"}
          </span>
        </div>
      </header>

      {/* Stats Row */}
      <div className="mb-8 flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold uppercase tracking-wider text-white/20">Learning</span>
          <span className="text-[14px] font-black text-white">12</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold uppercase tracking-wider text-white/20">Mistakes</span>
          <span className="text-[14px] font-black text-white/40">3</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold uppercase tracking-wider text-white/20">Time</span>
          <span className="text-[14px] font-black text-white/40">5m</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Primary Action: Continue Journey */}
        <button
          type="button"
          onClick={onSelectWords}
          className="group relative flex h-[120px] w-full flex-col items-start justify-center overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl transition-all active:scale-[0.98]"
        >
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
          <span className="text-[12px] font-black uppercase tracking-[0.2em] text-black/30">Continue Journey</span>
          <h2 className="mt-1 text-[22px] font-black text-black">Vocabulary Review</h2>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-black/5">
              <div className="h-full w-2/3 bg-blue-500" />
            </div>
            <span className="text-[11px] font-black text-black/40">14/20</span>
          </div>
          <Sparkles className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
        </button>

        {/* Continue Words */}
        <PracticeActionCard
          title="Continue Words"
          subtitle={dueCount > 0 ? `${dueCount} words waiting` : "All words reviewed"}
          icon={<BookOpen size={22} strokeWidth={2.5} />}
          onClick={onSelectWords}
          color="blue"
          badge={dueCount > 0 ? dueCount.toString() : undefined}
        />

        {/* Grammar Practice */}
        <PracticeActionCard
          title="Grammar Practice"
          subtitle={weakGrammarCount > 0 ? "Past Simple needs practice" : "No weak topics detected"}
          icon={<Sparkles size={22} strokeWidth={2.5} />}
          onClick={onSelectGrammar}
          color="purple"
          badge={weakGrammarCount > 0 ? "Weak" : undefined}
        />

        {/* Writing Check - Placeholder for now */}
        <PracticeActionCard
          title="Writing Check"
          subtitle="30+ words & AI feedback"
          icon={<PenTool size={22} strokeWidth={2.5} />}
          onClick={() => {}}
          color="emerald"
          disabled
        />

        {/* Quick Quiz - Placeholder for now */}
        <PracticeActionCard
          title="Quick Quiz"
          subtitle="5 questions"
          icon={<Target size={22} strokeWidth={2.5} />}
          onClick={() => {}}
          color="orange"
          disabled
        />
      </div>
    </div>
  )
}

function PracticeActionCard({
  title,
  subtitle,
  icon,
  onClick,
  color,
  badge,
  disabled = false
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  onClick: () => void
  color: "blue" | "purple" | "emerald" | "orange"
  badge?: string
  disabled?: boolean
}) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20"
  }

  const badgeColorMap = {
    blue: "bg-blue-500/20 text-blue-300",
    purple: "bg-purple-500/20 text-purple-300",
    emerald: "bg-emerald-500/20 text-emerald-300",
    orange: "bg-orange-500/20 text-orange-300"
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex h-[100px] w-full items-center gap-4 rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-4 text-left transition-all active:scale-[0.98] ${
        disabled ? "opacity-50 grayscale cursor-not-allowed" : "hover:bg-white/[0.05] hover:border-white/10"
      }`}
    >
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-colors ${colorMap[color]}`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-[17px] font-black text-white">{title}</h3>
        <p className="truncate text-[13px] font-bold text-white/30">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {badge && (
          <span className={`flex h-6 items-center rounded-full px-2 text-[10px] font-black uppercase tracking-wider ${badgeColorMap[color]}`}>
            {badge}
          </span>
        )}
        <ChevronRight size={18} className="text-white/10 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  )
}

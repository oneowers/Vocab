"use client"

import { BookOpen, Sparkles, PenTool, Target, ChevronRight, Clock, AlertCircle } from "lucide-react"
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
  // Mock data for better visual representation
  const mistakesCount = 3
  const learningCount = 12
  const estimatedTime = "5m"

  const hasMistakes = mistakesCount > 0
  const hasDue = dueCount > 0

  return (
    <div className="mx-auto max-w-xl px-4 pb-32 pt-6 md:pt-12">
      {/* Compact Header */}
      <header className="mb-5 px-1">
        <h1 className="text-[28px] font-black tracking-tight text-white md:text-[36px]">
          Practice
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-bold text-white/40">
          {hasDue && (
            <span className="text-blue-400">{dueCount} due</span>
          )}
          {hasDue && hasMistakes && <span className="opacity-20">·</span>}
          {hasMistakes && (
            <span className="text-rose-400">{mistakesCount} mistakes</span>
          )}
          {(hasDue || hasMistakes) && <span className="opacity-20">·</span>}
          <span className="flex items-center gap-1">
            <Clock size={12} className="opacity-50" />
            ~{estimatedTime}
          </span>
        </div>
      </header>

      {/* Stats Row - High Contrast Chips */}
      <div className="mb-8 flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/5 px-2.5 py-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/30">Learning</span>
          <span className="text-[13px] font-black text-white">{learningCount}</span>
        </div>
        {hasMistakes && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/10 px-2.5 py-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400/60">Mistakes</span>
            <span className="text-[13px] font-black text-rose-400">{mistakesCount}</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/5 px-2.5 py-1.5">
          <Clock size={12} className="text-white/20" />
          <span className="text-[13px] font-black text-white/60">{estimatedTime}</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Primary Action: Continue Vocabulary Review */}
        <button
          type="button"
          onClick={onSelectWords}
          className="group relative flex w-full flex-col items-start overflow-hidden rounded-[1.75rem] border border-blue-500/20 bg-[#151a24] p-6 transition-all active:scale-[0.98] hover:bg-[#1a212e] hover:border-blue-500/30 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.2)]"
        >
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
          
          <div className="flex w-full items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/20">
                <BookOpen size={20} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h2 className="text-[18px] font-black text-white leading-tight">Continue Review</h2>
                <p className="text-[12px] font-bold text-blue-400/60">{dueCount} words waiting</p>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform group-hover:translate-x-1">
              <ChevronRight size={18} />
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-white/30">
              <span>Progress</span>
              <span className="text-white/60">14 / 20</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-500/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "70%" }}
                className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" 
              />
            </div>
          </div>
        </button>

        {/* Secondary Actions Row */}
        <div className="grid gap-3 mt-4">
          {/* Grammar Practice */}
          <PracticeActionCard
            title="Grammar Practice"
            subtitle={weakGrammarCount > 0 ? "Past Simple needs practice" : "No weak topics detected"}
            icon={<Sparkles size={20} strokeWidth={2.5} />}
            onClick={onSelectGrammar}
            color="purple"
            badge={weakGrammarCount > 0 ? "Weak" : undefined}
            badgeColor={weakGrammarCount > 0 ? "rose" : undefined}
          />

          {/* Writing Check */}
          <PracticeActionCard
            title="Writing Check"
            subtitle="30+ words · AI feedback"
            icon={<PenTool size={20} strokeWidth={2.5} />}
            onClick={() => {}} // This should open the writing challenge
            color="emerald"
          />

          {/* Quick Quiz */}
          <PracticeActionCard
            title="Quick Quiz"
            subtitle="5 rapid questions"
            icon={<Target size={20} strokeWidth={2.5} />}
            onClick={() => {}}
            color="orange"
            disabled={dueCount < 3}
            disabledReason="Need 3+ words saved"
          />
        </div>
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
  badgeColor,
  disabled = false,
  disabledReason
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  onClick: () => void
  color: "blue" | "purple" | "emerald" | "orange"
  badge?: string
  badgeColor?: "rose" | "purple" | "blue" | "emerald" | "orange"
  disabled?: boolean
  disabledReason?: string
}) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/10",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/10",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/10"
  }

  const badgeColorMap = {
    rose: "bg-rose-500/20 text-rose-400 border-rose-500/20",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/20",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/20"
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex h-[92px] w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left transition-all active:scale-[0.98] ${
        disabled ? "opacity-60 grayscale-[0.5] cursor-not-allowed" : "hover:bg-white/[0.04] hover:border-white/10"
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${colorMap[color]}`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-[16px] font-black text-white">{title}</h3>
        <p className="truncate text-[12px] font-bold text-white/30">
          {disabled && disabledReason ? disabledReason : subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {badge && (
          <span className={`flex h-6 items-center rounded-full border px-2 text-[9px] font-black uppercase tracking-wider ${badgeColorMap[badgeColor || color]}`}>
            {badge}
          </span>
        )}
        {!disabled ? (
          <ChevronRight size={16} className="text-white/10 transition-transform group-hover:translate-x-0.5" />
        ) : (
          <AlertCircle size={14} className="text-white/5" />
        )}
      </div>
    </button>
  )
}

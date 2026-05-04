"use client"

import { BookOpen, Sparkles, PenTool, Target, ChevronRight, Clock, AlertCircle, Languages, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { useMemo } from "react"
import type { GrammarFindingRecord } from "@/lib/types"

interface PracticeModeSelectorProps {
  onSelectWords: () => void
  onSelectGrammar: () => void
  onSelectWriting: () => void
  onSelectQuiz: () => void
  onSelectTranslation: () => void
  onSelectHistory: () => void
  dueCount: number
  weakGrammarCount: number
  historyData: GrammarFindingRecord[]
}

export function PracticeModeSelector({
  onSelectWords,
  onSelectGrammar,
  onSelectWriting,
  onSelectQuiz,
  onSelectTranslation,
  onSelectHistory,
  dueCount,
  weakGrammarCount,
  historyData
}: PracticeModeSelectorProps) {
  const groupedHistory = useMemo(() => {
    const groups: Record<string, GrammarFindingRecord[]> = {}
    historyData.forEach(item => {
      if (item.sourceId && item.sourceId !== "unknown") {
        const key = `${item.sourceType}_${item.sourceId}`
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      }
    })

    return Object.values(groups)
      .map(items => ({
        id: items[0].sourceId!,
        sourceType: items[0].sourceType,
        totalScore: items.reduce((sum, i) => sum + i.scoreDelta, 0),
        createdAt: items[0].createdAt,
        title: items[0].sourceType === "writing_challenge" ? "Writing Challenge" : 
               items[0].sourceType === "translation_challenge" ? "Translation Challenge" : 
               `Lesson: ${items[0].topicTitleEn || items[0].topicKey}`
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  }, [historyData])

  const mistakesCount = 3
  const learningCount = 12
  const estimatedTime = "5m"

  const hasMistakes = mistakesCount > 0
  const hasDue = dueCount > 0

  return (
    <div className="mx-auto max-w-xl px-4 pb-32 pt-6 md:pt-12">
      {/* Compact Header */}
      <header className="mb-5 px-1">
        <h1 className="text-[28px] font-black tracking-tight text-ink md:text-[36px]">
          Practice
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-bold text-quiet">
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
        <div className="flex items-center gap-2 rounded-lg bg-bg-secondary border border-line px-2.5 py-1.5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-quiet">Learning</span>
          <span className="text-[13px] font-black text-ink">{learningCount}</span>
        </div>
        {hasMistakes && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/10 px-2.5 py-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400/60">Mistakes</span>
            <span className="text-[13px] font-black text-rose-400">{mistakesCount}</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg bg-bg-secondary border border-line px-2.5 py-1.5 shadow-sm">
          <Clock size={12} className="text-quiet" />
          <span className="text-[13px] font-black text-muted">{estimatedTime}</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Primary Action: Continue Vocabulary Review */}
        <button
          type="button"
          onClick={onSelectWords}
          className="group relative flex w-full flex-col items-start overflow-hidden rounded-[1.75rem] border border-blue-500/20 bg-bg-secondary p-6 transition-all active:scale-[0.98] hover:bg-blue-500/[0.03] hover:border-blue-500/30 shadow-panel"
        >
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
          
          <div className="flex w-full items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/20">
                <BookOpen size={20} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h2 className="text-[18px] font-black text-ink leading-tight">Continue Review</h2>
                <p className="text-[12px] font-bold text-blue-400/60">{dueCount} words waiting</p>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-bg-primary shadow-lg transition-transform group-hover:translate-x-1">
              <ChevronRight size={18} />
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-quiet">
              <span>Progress</span>
              <span className="text-muted">14 / 20</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-500/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "70%" }}
                className="h-full bg-blue-500 shadow-accent" 
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
            onClick={onSelectWriting}
            color="emerald"
          />

          {/* Quick Quiz */}
          <PracticeActionCard
            title="Quick Quiz"
            subtitle="5 rapid questions"
            icon={<Target size={20} strokeWidth={2.5} />}
            onClick={onSelectQuiz}
            color="orange"
            disabled={dueCount < 3}
            disabledReason="Need 3+ words saved"
          />

          {/* Translation Challenge */}
          <PracticeActionCard
            title="Translation"
            subtitle="RU → EN · AI Check"
            icon={<Languages size={20} strokeWidth={2.5} />}
            onClick={onSelectTranslation}
            color="blue"
            badge="New"
            badgeColor="blue"
          />

          {/* Recent Activity List Replacement */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-purple-400" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-purple-400/60">Recent Activity</h3>
              </div>
              <button 
                onClick={onSelectHistory}
                className="text-[11px] font-black uppercase tracking-widest text-muted hover:text-ink transition-colors"
              >
                View All
              </button>
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] backdrop-blur-md">
              <div className="flex flex-col">
                {groupedHistory.length > 0 ? (
                  groupedHistory.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={onSelectHistory}
                      className="group relative flex items-center justify-between border-b border-white/[0.02] p-5 last:border-0 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all group-hover:scale-105 ${
                          item.sourceType === 'writing_challenge' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                          item.sourceType === 'translation_challenge' ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/10'
                        }`}>
                           {item.sourceType === 'writing_challenge' ? <Sparkles size={20} /> :
                            item.sourceType === 'translation_challenge' ? <Languages size={20} /> :
                            <BookOpen size={20} />}
                        </div>
                        <div className="text-left">
                          <p className="text-[16px] font-black text-ink leading-tight">{item.title}</p>
                          <p className="text-[11px] font-bold text-quiet mt-1 uppercase tracking-wider">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`flex h-8 min-w-[50px] items-center justify-center rounded-full border px-3 text-[14px] font-black tracking-tight ${
                        item.totalScore > 0 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {item.totalScore > 0 ? '+' : ''}{item.totalScore}
                      </div>

                      {/* Subtle hover indicator */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white/0 group-hover:bg-white/10 rounded-l-full transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-[14px] font-bold text-white/10">Start practicing to see your activity</p>
                  </div>
                )}
              </div>
              
              {/* Premium Darkening Gradient Overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/40 to-transparent" />
            </div>
          </div>
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
      className={`group relative flex h-[92px] w-full items-center gap-4 rounded-2xl border border-line bg-bg-secondary p-4 text-left transition-all active:scale-[0.98] shadow-sm ${
        disabled ? "opacity-60 grayscale-[0.5] cursor-not-allowed" : "hover:bg-bg-tertiary hover:border-accent/20"
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${colorMap[color]}`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-[16px] font-black text-ink">{title}</h3>
        <p className="truncate text-[12px] font-bold text-quiet">
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
          <ChevronRight size={16} className="text-quiet transition-transform group-hover:translate-x-0.5" />
        ) : (
          <AlertCircle size={14} className="text-line" />
        )}
      </div>
    </button>
  )
}

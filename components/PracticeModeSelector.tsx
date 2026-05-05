"use client"

import { BookOpen, Sparkles, PenTool, Target, ChevronRight, Clock, AlertCircle, Languages, Activity, Flame, Brain, ListChecks, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useMemo } from "react"
import { AppleProgressCard, AppleListItem } from "./AppleDashboardComponents"
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
    <div className="mx-auto max-w-xl px-4 pb-32 pt-24 min-h-screen bg-black">

      {/* Stats Row - High Contrast Chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-2 rounded-full bg-[#1C1C1E] border border-white/[0.05] px-3 py-1.5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Learning</span>
          <span className="text-[13px] font-black text-white">{learningCount}</span>
        </div>
        {hasMistakes && (
          <div className="flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/10 px-3 py-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400/60">Mistakes</span>
            <span className="text-[13px] font-black text-rose-400">{mistakesCount}</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-full bg-[#1C1C1E] border border-white/[0.05] px-3 py-1.5 shadow-sm">
          <Clock size={12} className="text-white/40" />
          <span className="text-[13px] font-black text-white/60">{estimatedTime}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Primary Action: Continue Vocabulary Review */}
        <div className="px-1">
          <AppleProgressCard
            title="Continue Review"
            current={14}
            total={20}
            href="#"
            progressColor="bg-[#0A84FF]"
          />
          <p className="mt-2.5 px-3 text-[12px] font-medium text-white/30">
            {dueCount} words waiting for your review
          </p>
        </div>

        {/* Secondary Actions List */}
        <div className="px-1">
          <div className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-white/[0.03]">
            <AppleListItem 
              title="Grammar Rules" 
              subtitle="Perfect your sentence structure"
              icon={<Brain size={18} />} 
              iconColor="bg-blue-500"
              rightLabel="Ready"
              onClick={onSelectGrammar}
              showDivider={true}
            />
            <AppleListItem 
              title="Writing Challenge" 
              subtitle="Get AI feedback on your writing"
              icon={<PenTool size={18} />} 
              iconColor="bg-orange-500"
              rightLabel="Daily"
              onClick={onSelectWriting}
              showDivider={true}
            />
            <AppleListItem 
              title="Quiz Mode" 
              subtitle="Test your word recall"
              icon={<ListChecks size={18} />} 
              iconColor="bg-green-500"
              rightLabel="Fast"
              onClick={onSelectQuiz}
              showDivider={true}
            />
            <AppleListItem 
              title="Deep Translation" 
              subtitle="Focus on contextual meaning"
              icon={<Languages size={18} />} 
              iconColor="bg-purple-500"
              rightLabel="Advanced"
              onClick={onSelectTranslation}
            />
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 space-y-4 px-1">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#BF5AF2]" />
              <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.05em]">
                Recent Activity
              </h3>
            </div>
            <button 
              onClick={onSelectHistory}
              className="text-[13px] font-semibold text-[#0A84FF] flex items-center active:opacity-60 transition-opacity"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-white/[0.03]">
            {groupedHistory.length > 0 ? (
              groupedHistory.map((item, index) => (
                <AppleListItem
                  key={item.id}
                  title={item.title}
                  subtitle={`Last used: ${new Date(item.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : new Date(item.createdAt).toLocaleDateString()}`}
                  icon={item.sourceType === 'writing_challenge' ? <Sparkles size={16} /> :
                        item.sourceType === 'translation_challenge' ? <Languages size={16} /> :
                        <BookOpen size={16} />}
                  iconColor={item.sourceType === 'writing_challenge' ? 'bg-[#34C759]' :
                             item.sourceType === 'translation_challenge' ? 'bg-[#0A84FF]' :
                             'bg-[#BF5AF2]'}
                  onClick={onSelectHistory}
                  rightLabel={`${item.totalScore > 0 ? '+' : ''}${item.totalScore} XP`}
                  showDivider={index !== groupedHistory.length - 1}
                />
              ))
            ) : (
              <div className="p-10 text-center">
                <p className="text-[14px] font-medium text-white/20">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


"use client"
 
import { BookOpen, Sparkles, PenTool, Target, ChevronRight, Clock, AlertTriangle, Languages, Activity, Flame, Brain, ListChecks, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useMemo } from "react"
import { AppleProgressCard, AppleListItem, AppleCard } from "./AppleDashboardComponents"
import type { GrammarFindingRecord } from "@/lib/types"
 
interface PracticeModeSelectorProps {
  onSelectWords: () => void
  onSelectGrammar: () => void
  onSelectWriting: () => void
  onSelectQuiz: () => void
  onSelectTranslation: () => void
  onSelectHistory: () => void
  dueCount: number
  claimedToday: number
  writingToday: number
  quizToday: number
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
  claimedToday,
  writingToday,
  quizToday,
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
 
  // Calculate total progress percentage for the progress card
  const vocabularyProgress = Math.min(100, (claimedToday / 10) * 100)
  const writingProgress = writingToday >= 1 ? 100 : 0
  const quizProgress = quizToday >= 1 ? 100 : 0
  
  const overallProgress = Math.round((vocabularyProgress + writingProgress + quizProgress) / 3)
 
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-32 min-h-screen bg-black">
      <div className="pt-16 md:pt-10" />
      {/* Dynamic Summary Chips */}
      <div className="mb-8 flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-2 rounded-full bg-white/[0.05] border border-white/[0.08] px-4 py-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-white/40">Vocabulary</span>
          <span className="text-[14px] font-black text-white">{claimedToday}/10</span>
        </div>
        {weakGrammarCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400/80">Weak Areas</span>
            <span className="text-[14px] font-black text-amber-400">{weakGrammarCount}</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-full bg-white/[0.05] border border-white/[0.08] px-4 py-2">
          <Clock size={14} className="text-white/40" />
          <span className="text-[14px] font-black text-white/60">Practice</span>
        </div>
      </div>
 
      <div className="space-y-8">
        {/* Main Progress Section */}
        <div className="px-1">
          <AppleProgressCard
            title="Daily Practice Progress"
            current={overallProgress}
            total={100}
            href="#"
            progressColor="bg-white"
          />
          <p className="mt-3 px-2 text-[13px] font-bold text-white/20">
            {dueCount} words waiting for review today
          </p>
        </div>
 
        {/* Practice Modes Grid/List */}
        <div className="px-1">
          <AppleCard className="overflow-hidden">
            <AppleListItem 
              title="Grammar Rules" 
              subtitle="Perfect your sentence structure"
              icon={<Brain size={18} />} 
              iconColor="bg-[#5E5CE6]"
              rightLabel={weakGrammarCount > 0 ? "Review" : "Learn"}
              onClick={onSelectGrammar}
              showDivider={true}
            />
            <AppleListItem 
              title="Writing Challenge" 
              subtitle="Get AI feedback on your writing"
              icon={<Sparkles size={18} />} 
              iconColor="bg-[#BF5AF2]"
              rightLabel={writingToday > 0 ? "Done" : "Daily"}
              onClick={onSelectWriting}
              showDivider={true}
            />
            <AppleListItem 
              title="Knowledge Quiz" 
              subtitle="Test your word recall"
              icon={<Target size={18} />} 
              iconColor="bg-[#FF9F0A]"
              rightLabel={quizToday > 0 ? "Done" : "Fast"}
              onClick={onSelectQuiz}
              showDivider={true}
            />
            <AppleListItem 
              title="Deep Translation" 
              subtitle="Focus on contextual meaning"
              icon={<Languages size={18} />} 
              iconColor="bg-[#0A84FF]"
              rightLabel="Advanced"
              onClick={onSelectTranslation}
            />
          </AppleCard>
        </div>
 
        {/* Recent Activity Feed */}
        <div className="space-y-4 px-1">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/20" />
              <h3 className="text-[12px] font-black text-white/30 uppercase tracking-[0.15em]">
                Activity Feed
              </h3>
            </div>
            <button 
              onClick={onSelectHistory}
              className="text-[14px] font-black text-[#0A84FF] active:opacity-60 transition-opacity"
            >
              See All
            </button>
          </div>
 
          <AppleCard className="overflow-hidden">
            {groupedHistory.length > 0 ? (
              groupedHistory.map((item, index) => (
                <AppleListItem
                  key={item.id}
                  title={item.title}
                  subtitle={new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
              <div className="py-16 text-center">
                <Activity size={32} className="mx-auto mb-4 text-white/10" />
                <p className="text-[15px] font-bold text-white/20">No recent activity</p>
              </div>
            )}
          </AppleCard>
        </div>
      </div>
    </div>
  )
}

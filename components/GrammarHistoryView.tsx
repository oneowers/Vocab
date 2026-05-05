"use client"
 
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Activity, TrendingUp, TrendingDown, Clock, ChevronDown, Sparkles, BookOpen, Languages, Calendar, AlertTriangle } from "lucide-react"
import type { GrammarFindingRecord } from "@/lib/types"
import { AppleHeader, AppleCard } from "@/components/AppleDashboardComponents"
 
interface GrammarHistoryViewProps {
  historyData: GrammarFindingRecord[]
  onBack: () => void
}
 
export function GrammarHistoryView({ historyData, onBack }: GrammarHistoryViewProps) {
  const groupedHistory = useMemo(() => {
    const groups: Record<string, GrammarFindingRecord[]> = {}
    const ungrouped: GrammarFindingRecord[] = []
 
    historyData.forEach(item => {
      if (item.sourceId && item.sourceId !== "unknown") {
        const key = `${item.sourceType}_${item.sourceId}`
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      } else {
        ungrouped.push(item)
      }
    })
 
    const final = [
      ...Object.values(groups).map(items => ({
        id: items[0].sourceId!,
        isGroup: true,
        sourceType: items[0].sourceType,
        items,
        totalScore: items.reduce((sum, i) => sum + i.scoreDelta, 0),
        createdAt: items[0].createdAt,
        title: items[0].sourceType === "writing_challenge" ? "Writing Challenge" : 
               items[0].sourceType === "translation_challenge" ? "Translation Challenge" : 
               `Lesson: ${items[0].topicTitleEn || items[0].topicKey}`
      })),
      ...ungrouped.map(item => ({
        id: item.id,
        isGroup: false,
        sourceType: item.sourceType,
        items: [item],
        totalScore: item.scoreDelta,
        createdAt: item.createdAt,
        title: item.topicTitleEn || item.topicKey
      }))
    ]
 
    return final.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [historyData])
 
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <AppleHeader 
        title="Activity Log" 
        onBack={onBack}
        sticky={true}
      />
 
      <div className="mx-auto w-full max-w-xl px-4 pt-24 pb-32 space-y-6">
        <header className="mb-6 px-1">
          <p className="text-[17px] font-bold text-white/40">Your recent grammar performance</p>
        </header>
 
        {groupedHistory.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/[0.03] text-white/10 mb-6">
               <Activity size={24} />
             </div>
             <h3 className="text-[18px] font-black text-white">No history yet</h3>
             <p className="mt-1 text-[14px] text-white/30 max-w-xs font-medium">
               Complete grammar exercises or writing challenges to see your progress here.
             </p>
           </div>
        ) : (
          <div className="space-y-3">
            {groupedHistory.map((group, idx) => (
              <HistoryItem key={group.id} group={group} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
 
function HistoryItem({ group, index }: { group: any, index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
 
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <AppleCard>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-6 flex items-center justify-between cursor-pointer active:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] border ${
              group.sourceType === 'writing_challenge' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              group.sourceType === 'translation_challenge' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}>
              {group.sourceType === 'writing_challenge' ? <Sparkles size={20} /> :
               group.sourceType === 'translation_challenge' ? <Languages size={20} /> :
               <BookOpen size={20} />}
            </div>
            <div>
              <h3 className="text-[16px] font-black text-white leading-tight tracking-tight">{group.title}</h3>
              <div className="flex items-center text-[11px] font-bold text-white/20 mt-1">
                <Clock size={11} className="mr-1" />
                {new Date(group.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
 
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1 font-black text-[18px] tracking-tight ${group.totalScore > 0 ? 'text-emerald-400' : group.totalScore < 0 ? 'text-rose-400' : 'text-white/40'}`}>
              {group.totalScore > 0 ? '+' : ''}{group.totalScore}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="text-white/20"
            >
              <ChevronDown size={18} />
            </motion.div>
          </div>
        </div>
 
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white/[0.02] border-t border-white/[0.05]"
            >
              <div className="p-4 space-y-2">
                 {group.items.map((item: any) => (
                   <div key={item.id} className="p-4 rounded-2xl bg-black/20 border border-white/5">
                     <div className="flex items-start justify-between gap-4">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1.5">
                           <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.1em]">
                             {item.topicTitleEn || item.topicKey}
                           </span>
                           <div className={`h-1.5 w-1.5 rounded-full ${item.isCorrect ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                         </div>
                         <p className="text-[14px] text-white/40 font-bold leading-relaxed">
                           {item.explanationRu}
                         </p>
                         
                         {!item.isCorrect && item.original !== "Grammar Exercise" && (
                           <div className="mt-3 rounded-xl bg-black/60 p-3 text-[12px] border border-white/5 font-mono shadow-inner">
                             <div className="text-rose-400/60 line-through mb-1">{item.original}</div>
                             <div className="text-emerald-400/80">{item.corrected}</div>
                           </div>
                         )}
                       </div>
                       <div className={`text-[13px] font-black ${item.scoreDelta > 0 ? 'text-emerald-400/60' : 'text-rose-400/60'}`}>
                         {item.scoreDelta > 0 ? '+' : ''}{item.scoreDelta}
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AppleCard>
    </motion.div>
  )
}

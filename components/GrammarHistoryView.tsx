"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Activity, TrendingUp, TrendingDown, Clock, ChevronDown, Sparkles, BookOpen, Languages } from "lucide-react"
import type { GrammarFindingRecord } from "@/lib/types"

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
    <div className="min-h-screen bg-[#0a0c10] overflow-y-auto pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#0a0c10]/80 px-4 py-4 backdrop-blur-xl">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors flex items-center gap-2 font-bold">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex items-center gap-2">
          <Activity className="text-blue-400" size={18} />
          <span className="text-[14px] font-black uppercase tracking-widest text-white/60">Activity Log</span>
        </div>
        <div className="w-20" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {groupedHistory.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/10 mb-6">
               <Activity size={24} />
             </div>
             <h3 className="text-[18px] font-black text-white">No history yet</h3>
             <p className="mt-1 text-[14px] text-white/30 max-w-xs">
               Complete grammar exercises or writing challenges to see your progress here.
             </p>
           </div>
        ) : (
          <div className="space-y-4">
            {groupedHistory.map((group, idx) => (
              <HistoryItem key={group.id} group={group} index={idx} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function HistoryItem({ group, index }: { group: any, index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden"
    >
      {/* Group Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            group.sourceType === 'writing_challenge' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            group.sourceType === 'translation_challenge' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-purple-500/10 text-purple-400 border-purple-500/20'
          }`}>
            {group.sourceType === 'writing_challenge' ? <Sparkles size={20} /> :
             group.sourceType === 'translation_challenge' ? <Languages size={20} /> :
             <BookOpen size={20} />}
          </div>
          <div>
            <h3 className="text-[15px] font-black text-white leading-tight">{group.title}</h3>
            <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-white/20 mt-1">
              <Clock size={10} className="mr-1" />
              {new Date(group.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1 font-black text-[18px] ${group.totalScore > 0 ? 'text-emerald-400' : group.totalScore < 0 ? 'text-rose-400' : 'text-white/40'}`}>
            {group.totalScore > 0 ? '+' : ''}{group.totalScore}
            <span className="text-[10px] uppercase tracking-widest ml-0.5 opacity-60">pts</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-white/20"
          >
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </div>

      {/* Impact List (Collapsible) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/20"
          >
            <div className="p-2 space-y-1">
               <div className="px-3 pt-2 pb-1">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Impact Details</span>
               </div>
               {group.items.map((item: any) => (
                 <div key={item.id} className="p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-[11px] font-black text-white/60 uppercase tracking-wider">
                           {item.topicTitleEn || item.topicKey}
                         </span>
                         <div className={`h-1 w-1 rounded-full ${item.isCorrect ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                       </div>
                       <p className="text-[13px] text-white/40 font-medium">
                         {item.explanationRu}
                       </p>
                       
                       {!item.isCorrect && item.original !== "Grammar Exercise" && (
                         <div className="mt-2 rounded-xl bg-black/40 p-2.5 text-[12px] border border-white/5 font-mono">
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
    </motion.div>
  )
}

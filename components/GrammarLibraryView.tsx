"use client"

import { ArrowLeft, BookOpen, ChevronRight, Lock, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { GRAMMAR_TOPICS } from "@/lib/grammar-content"
import type { GrammarSkillsPayload } from "@/lib/types"

interface GrammarLibraryViewProps {
  grammarData: GrammarSkillsPayload
  onBack: () => void
  onSelectTopic: (key: string) => void
}

export function GrammarLibraryView({ grammarData, onBack, onSelectTopic }: GrammarLibraryViewProps) {
  const topics = Object.values(GRAMMAR_TOPICS)

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="mb-10 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/5"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-white">Grammar Library</h1>
          <p className="text-[15px] font-medium text-white/40">Explore all topics from A1 to B2</p>
        </div>
      </header>

      <div className="space-y-4">
        {topics.map((topic, index) => {
          const skill = grammarData.items.find(item => item.topic.key === topic.key)
          const score = skill?.score ?? 0
          const isStarted = !!skill
          
          let status = "Not started"
          let statusColor = "bg-white/5 text-white/30"
          
          if (isStarted) {
            if (score < -30) {
              status = "Weak"
              statusColor = "bg-rose-500/20 text-rose-400 border-rose-500/20"
            } else if (score < 30) {
              status = "Learning"
              statusColor = "bg-amber-500/20 text-amber-400 border-amber-500/20"
            } else {
              status = "Strong"
              statusColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
            }
          }

          return (
            <motion.button
              key={topic.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectTopic(topic.key)}
              className="group relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-left transition-all hover:bg-white/[0.06] active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                      {topic.cefrLevel}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${statusColor}`}>
                      {status}
                    </span>
                  </div>
                  <h2 className="text-[20px] font-black text-white">{topic.titleEn}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/40">
                    {topic.descriptionRu}
                  </p>
                </div>
                
                <div className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/20 transition-colors group-hover:bg-white/10 group-hover:text-white">
                  <ChevronRight size={20} />
                </div>
              </div>

              {/* Progress Bar */}
              {isStarted && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                    <span className="text-white/30">Proficiency</span>
                    <span className="text-white">{Math.max(0, score)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                      className={`h-full rounded-full ${score < -30 ? "bg-rose-500" : score < 30 ? "bg-amber-500" : "bg-emerald-500"}`}
                    />
                  </div>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

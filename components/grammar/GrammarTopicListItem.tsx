"use client"

import React from "react"
import { CheckCircle2, ChevronRight, History } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function GrammarTopicListItem({ item, index }: { item: GrammarSkillRecord, index: number }) {
  const hasEvidence = item.evidenceCount > 0
  const scoreBand = item.score < -30 ? "Weak" : item.score < 30 ? "Learning" : "Strong"
  
  const bandColors = {
    Weak: "text-rose-400 bg-rose-500/10 border-rose-500/10",
    Learning: "text-amber-400 bg-amber-500/10 border-amber-500/10",
    Strong: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10"
  }

  const dateStr = item.lastDetectedAt 
    ? new Date(item.lastDetectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 15) * 0.03 }}
      className="group relative flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.05] active:scale-[0.99] md:p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges Row */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/5">
              {item.topic.cefrLevel}
            </span>
            {hasEvidence && (
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border ${bandColors[scoreBand]}`}>
                {scoreBand}
              </span>
            )}
          </div>
          
          <h3 className="truncate text-[15px] font-black text-white md:text-[16px]">
            {item.topic.titleEn}
          </h3>
          <p className="truncate text-[12px] font-bold text-white/30 md:text-[13px]">
            {item.topic.titleRu}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasEvidence && (
            <div className="text-right">
              <span className={`text-[18px] font-black ${
                item.score < -30 ? "text-rose-400" :
                item.score < 30 ? "text-amber-400" :
                "text-emerald-400"
              }`}>
                {item.score}
              </span>
            </div>
          )}
          <ChevronRight size={14} className="text-white/10" />
        </div>
      </div>

      {/* Progress & Metadata Footer */}
      <div className="mt-3 flex items-center gap-4">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
          <div 
            className={`h-full transition-all duration-1000 ${
              item.score < -30 ? "bg-rose-500" :
              item.score < 30 ? "bg-amber-500" :
              "bg-emerald-500"
            }`}
            style={{ width: hasEvidence ? `${Math.max(5, (item.score + 100) / 2)}%` : "0%" }}
          />
        </div>
        
        {hasEvidence && (
          <div className="flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-widest text-white/20">
            <div className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-500/50" />
              <span>{item.positiveEvidenceCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <History size={10} className="text-rose-500/50" />
              <span>{item.negativeEvidenceCount}</span>
            </div>
            {dateStr && <span>{dateStr}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

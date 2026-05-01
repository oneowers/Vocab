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
      transition={{ delay: (index % 15) * 0.02 }}
      className="group relative flex flex-col rounded-xl border border-white/5 bg-white/[0.01] p-2.5 transition-all hover:bg-white/[0.03] active:scale-[0.99] md:p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges Row */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="rounded-full bg-white/5 px-1 py-0.5 text-[7px] font-black uppercase tracking-widest text-white/40 border border-white/5">
              {item.topic.cefrLevel}
            </span>
            {hasEvidence && (
              <span className={`rounded-full px-1 py-0.5 text-[7px] font-black uppercase tracking-widest border ${bandColors[scoreBand]}`}>
                {scoreBand}
              </span>
            )}
          </div>
          
          <h3 className="truncate text-[14px] font-black text-white md:text-[15px]">
            {item.topic.titleEn}
          </h3>
          <p className="truncate text-[11px] font-bold text-white/20 md:text-[12px]">
            {item.topic.titleRu}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasEvidence && (
            <div className="text-right">
              <span className={`text-[16px] font-black ${
                item.score < -30 ? "text-rose-400" :
                item.score < 30 ? "text-amber-400" :
                "text-emerald-400"
              }`}>
                {item.score}
              </span>
            </div>
          )}
          <ChevronRight size={12} className="text-white/10" />
        </div>
      </div>

      {/* Progress & Metadata Footer */}
      <div className="mt-2 flex items-center gap-3">
        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/5">
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
          <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-white/10">
            <div className="flex items-center gap-0.5">
              <CheckCircle2 size={9} className="text-emerald-500/30" />
              <span>{item.positiveEvidenceCount}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <History size={9} className="text-rose-500/30" />
              <span>{item.negativeEvidenceCount}</span>
            </div>
            {dateStr && <span>{dateStr}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

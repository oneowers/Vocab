"use client"

import React from "react"
import { ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function GrammarTopicRow({ item, index }: { item: GrammarSkillRecord, index: number }) {
  const hasEvidence = item.evidenceCount > 0
  const scoreBand = item.score < -30 ? "Weak" : item.score < 30 ? "Learning" : "Strong"
  
  const bandColors = {
    Weak: "text-rose-500 bg-rose-500/10 border-rose-500/10",
    Learning: "text-amber-500 bg-amber-500/10 border-amber-500/10",
    Strong: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 15) * 0.02 }}
      className="group relative flex flex-col rounded-2xl border border-white/[0.04] bg-[#1a1a1f]/50 p-3 transition-all hover:bg-[#1a1a1f] active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/5">
              {item.topic.cefrLevel}
            </span>
            {hasEvidence && (
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border ${bandColors[scoreBand]}`}>
                {scoreBand}
              </span>
            )}
          </div>
          
          <h3 className="truncate text-[15px] font-black text-white">
            {item.topic.titleEn}
          </h3>
          <p className="truncate text-[12px] font-bold text-white/30">
            {item.topic.titleRu}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasEvidence && (
            <div className="text-right">
              <span className={`text-[18px] font-black ${
                item.score < -30 ? "text-rose-500" :
                item.score < 30 ? "text-amber-500" :
                "text-emerald-500"
              }`}>
                {item.score}
              </span>
            </div>
          )}
          <ChevronRight size={14} className="text-white/10" />
        </div>
      </div>

      {/* Progress Footer - Very Minimal */}
      {hasEvidence && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div 
            className={`h-full transition-all duration-1000 ${
              item.score < -30 ? "bg-rose-500" :
              item.score < 30 ? "bg-amber-500" :
              "bg-emerald-500"
            }`}
            style={{ width: `${Math.max(5, (item.score + 100) / 2)}%` }}
          />
        </div>
      )}
    </motion.div>
  )
}

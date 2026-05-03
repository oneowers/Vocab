"use client"

import React from "react"
import { ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function GrammarTopicRow({ item, index, onClick }: { item: GrammarSkillRecord, index: number, onClick?: () => void }) {
  const hasEvidence = item.evidenceCount > 0
  const scoreBand = item.score < -30 ? "Weak" : item.score < 30 ? "Learning" : "Strong"
  
  const bandColors = {
    Weak: "text-rose-500 bg-rose-500/10 border-rose-500/10",
    Learning: "text-amber-500 bg-amber-500/10 border-amber-500/10",
    Strong: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10"
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 15) * 0.02 }}
      className="group relative flex w-full flex-col text-left rounded-2xl border border-line bg-bg-secondary/40 p-3 transition-all hover:bg-bg-tertiary active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="rounded-full bg-bg-tertiary px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-muted border border-line">
              {item.topic.cefrLevel}
            </span>
            {hasEvidence && (
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border ${bandColors[scoreBand]}`}>
                {scoreBand}
              </span>
            )}
          </div>
          
          <h3 className="truncate text-[15px] font-black text-ink">
            {item.topic.titleEn}
          </h3>
          <p className="truncate text-[12px] font-bold text-muted">
            {item.topic.titleRu}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasEvidence && (
            <div className="text-right flex items-baseline gap-1">
              <span className={`text-[18px] font-black ${
                item.score < -30 ? "text-rose-500" :
                item.score < 30 ? "text-amber-500" :
                "text-emerald-500"
              }`}>
                {item.score > 0 ? `+${item.score}` : item.score}
              </span>
              <span className="text-[10px] font-black uppercase text-muted tracking-wider">pts</span>
            </div>
          )}
          <ChevronRight size={14} className="text-quiet" />
        </div>
      </div>

      {/* Progress Footer - Very Minimal */}
      {hasEvidence && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-bg-tertiary">
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
    </motion.button>
  )
}

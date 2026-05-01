"use client"

import React from "react"
import { ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function RecommendedTopicCard({ item }: { item: GrammarSkillRecord }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] p-3 active:scale-[0.99] transition-transform md:p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/10">
              {item.topic.cefrLevel}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-rose-400/60">Weakest</span>
          </div>
          
          <h3 className="truncate text-[16px] font-black text-white md:text-[18px]">
            {item.topic.titleEn}
          </h3>
          <p className="truncate text-[12px] font-bold text-amber-300/30">
            {item.topic.titleRu}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[18px] font-black text-amber-400 md:text-[22px]">
              {item.score}
            </span>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/20">
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
      
      {/* Tiny Progress Bar */}
      <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
        <div 
          className="h-full bg-amber-500"
          style={{ width: `${Math.max(10, (item.score + 100) / 2)}%` }}
        />
      </div>
    </motion.div>
  )
}

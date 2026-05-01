"use client"

import React from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function RecommendedTopicCard({ item }: { item: GrammarSkillRecord }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#1a1a1f] p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/50 border border-white/5">
              {item.topic.cefrLevel}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Weak Area</span>
          </div>
          
          <h3 className="text-[17px] font-black text-white truncate">
            {item.topic.titleEn}
          </h3>
          <p className="text-[14px] font-bold text-white/40 truncate">
            {item.topic.titleRu}
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white/5">
            <div 
              className="h-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              style={{ width: `${Math.max(10, (item.score + 100) / 2)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[24px] font-black text-white">
              {item.score}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

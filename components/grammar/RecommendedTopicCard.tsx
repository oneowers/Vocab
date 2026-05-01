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
      className="group relative overflow-hidden rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/20">
              {item.topic.cefrLevel}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Weak Area</span>
          </div>
          
          <h3 className="mt-2 text-[17px] font-black text-white truncate">
            {item.topic.titleEn}
          </h3>
          <p className="text-[13px] font-bold text-amber-300/40 truncate">
            {item.topic.titleRu}
          </p>
          
          {/* Minimal Progress */}
          <div className="mt-3 h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-white/5">
            <div 
              className="h-full bg-amber-500"
              style={{ width: `${Math.max(10, (item.score + 100) / 2)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-[20px] font-black text-amber-400">
            {item.score}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

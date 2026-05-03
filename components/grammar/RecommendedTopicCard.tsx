"use client"

import React from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function RecommendedTopicCard({ item, onClick }: { item: GrammarSkillRecord; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative w-full text-left overflow-hidden rounded-[1.5rem] border border-line bg-bg-tertiary p-4 active:scale-[0.98] transition-transform shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted border border-line">
              {item.topic.cefrLevel}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Weak Area</span>
          </div>
          
          <h3 className="text-[17px] font-black text-ink truncate">
            {item.topic.titleEn}
          </h3>
          <p className="text-[14px] font-bold text-muted truncate">
            {item.topic.titleRu}
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-bg-secondary">
            <div 
              className="h-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              style={{ width: `${Math.max(10, (item.score + 100) / 2)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[24px] font-black text-ink">
              {item.score}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-bg-primary shadow-lg group-hover:scale-110 transition-transform">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </motion.button>
  )
}

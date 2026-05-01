"use client"

import React from "react"
import { CheckCircle2, ChevronRight, History } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function GrammarTopicCard({ item, index }: { item: GrammarSkillRecord, index: number }) {
  const hasEvidence = item.evidenceCount > 0
  const scoreBand = item.score < -30 ? "Weak" : item.score < 30 ? "Learning" : "Strong"
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 10) * 0.05 }}
      className="group relative flex flex-col rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] active:scale-[0.99] md:rounded-[2rem] md:p-5"
    >
      {/* Mobile Row Layout */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 md:mb-1">
            <h3 className="truncate text-[16px] font-black text-white md:text-[18px]">
              {item.topic.titleEn}
            </h3>
            <span className="hidden rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/40 md:block">
              {item.topic.cefrLevel}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="truncate text-[12px] font-bold text-white/30 md:text-[13px]">
              {item.topic.titleRu}
            </p>
            {hasEvidence && (
              <div className="flex items-center gap-1.5 md:hidden">
                <span className="h-1 w-1 rounded-full bg-white/10" />
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  item.score < -30 ? "text-rose-400" :
                  item.score < 30 ? "text-amber-400" :
                  "text-emerald-400"
                }`}>
                  {scoreBand}
                </span>
                <span className="text-[10px] font-black text-white/40">·</span>
                <span className="text-[10px] font-black text-white/60">{item.score}</span>
              </div>
            )}
          </div>
        </div>

        {/* Score & Chevron for Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <ChevronRight size={18} className="text-white/10" />
        </div>

        {/* Desktop Score */}
        {hasEvidence && (
          <div className="hidden text-right md:block">
            <span className={`text-[24px] font-black ${
              item.score < -30 ? "text-rose-400" :
              item.score < 30 ? "text-amber-400" :
              "text-emerald-400"
            }`}>
              {item.score}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar - Minimal on Mobile */}
      {hasEvidence && (
        <div className="mt-3 md:mt-6">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5 md:h-1.5">
            <div 
              className={`h-full transition-all duration-1000 ${
                item.score < -30 ? "bg-rose-500" :
                item.score < 30 ? "bg-amber-500" :
                "bg-emerald-500"
              }`}
              style={{ width: `${Math.max(5, (item.score + 100) / 2)}%` }}
            />
          </div>
        </div>
      )}

      {/* Description - Desktop only or expandable? Let's hide on mobile for row-feel */}
      <p className="mt-4 hidden line-clamp-2 text-[14px] leading-relaxed text-white/50 md:block">
        {item.topic.description}
      </p>

      {/* Latest Finding - Hidden on mobile Topic Library to keep it row-like */}
      {item.latestFinding && !item.latestFinding.isCorrect && (
        <div className="mt-5 hidden rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 md:block">
          <div className="flex items-center gap-2 mb-2">
            <History size={12} className="text-rose-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400/50">Last Error</span>
          </div>
          <p className="text-[13px] font-bold text-rose-300/60 line-through decoration-rose-500/30">
            {item.latestFinding.original}
          </p>
          <p className="mt-1 text-[14px] font-black text-emerald-400">
            {item.latestFinding.corrected}
          </p>
        </div>
      )}

      {/* Footer Stats - Desktop only */}
      {hasEvidence && (
        <div className="mt-4 hidden items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-white/20 md:flex md:mt-6">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500/50" />
            <span>{item.positiveEvidenceCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <History size={12} className="text-rose-500/50" />
            <span>{item.negativeEvidenceCount}</span>
          </div>
          {item.lastDetectedAt && (
            <span className="ml-auto">
              {new Date(item.lastDetectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

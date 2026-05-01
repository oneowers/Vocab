"use client"

import React from "react"
import { CheckCircle2, ChevronRight, History } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function GrammarTopicCard({ item, index }: { item: GrammarSkillRecord, index: number }) {
  const hasEvidence = item.evidenceCount > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 10) * 0.05 }}
      className="group relative flex flex-col rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.05] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5">
              {item.topic.cefrLevel}
            </span>
            {hasEvidence && (
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${item.score < -30 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                  item.score < 30 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                {item.score < -30 ? "Weak" : item.score < 30 ? "Learning" : "Strong"}
              </span>
            )}
          </div>
          <h3 className="text-[18px] font-black text-white truncate">{item.topic.titleEn}</h3>
          <p className="text-[13px] font-bold text-white/30">{item.topic.titleRu}</p>
        </div>
        {hasEvidence && (
          <div className="text-right">
            <span className={`text-[24px] font-black ${item.score < -30 ? "text-rose-400" :
                item.score < 30 ? "text-amber-400" :
                  "text-emerald-400"
              }`}>
              {item.score}
            </span>
          </div>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-[14px] leading-relaxed text-white/50">
        {item.topic.description}
      </p>

      {/* Progress Line */}
      {hasEvidence && (
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full transition-all duration-1000 ${item.score < -30 ? "bg-rose-500" :
                item.score < 30 ? "bg-amber-500" :
                  "bg-emerald-500"
              }`}
            style={{ width: `${Math.max(5, (item.score + 100) / 2)}%` }}
          />
        </div>
      )}

      {/* Latest Finding */}
      {item.latestFinding && !item.latestFinding.isCorrect && (
        <div className="mt-5 rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4">
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

      {!hasEvidence && (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/20">No data yet</span>
          <ChevronRight size={16} className="text-white/10" />
        </div>
      )}

      {hasEvidence && (
        <div className="mt-6 flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-white/20">
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

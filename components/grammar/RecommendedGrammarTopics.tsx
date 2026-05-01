"use client"

import React from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"

export function RecommendedGrammarTopics({ items }: { items: GrammarSkillRecord[] }) {
  return (
    <section className="space-y-4 px-4 md:px-0">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-amber-400" />
        <h2 className="text-[14px] font-bold uppercase tracking-widest text-amber-400/60">Recommended for you</h2>
      </div>
      
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item, i) => (
          <motion.div
            key={item.topic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-4 transition-all hover:bg-amber-500/10 active:scale-[0.98] md:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/20">
                    {item.topic.cefrLevel}
                  </span>
                  {item.score < -15 && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-rose-400">Weak Area</span>
                  )}
                </div>
                <h3 className="mt-2 text-[17px] font-black text-white truncate md:text-[18px]">
                  {item.topic.titleEn}
                </h3>
                <p className="mt-1 text-[13px] font-bold text-amber-300/40 truncate md:text-[14px]">
                  {item.topic.titleRu}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-[20px] font-black md:text-[24px] ${item.score < -15 ? "text-rose-400" : "text-amber-400"}`}>
                  {item.score}
                </span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[11px] font-medium text-amber-200/40 line-clamp-1">
                  {item.negativeEvidenceCount > 0 ? `${item.negativeEvidenceCount} mistakes detected` : "Needs practice"}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/40 transition-colors">
                <ArrowRight size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

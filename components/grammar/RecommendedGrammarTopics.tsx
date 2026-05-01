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
        <h2 className="text-[17px] font-black text-white uppercase tracking-wider">Recommended for you</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item, i) => (
          <motion.div
            key={item.topic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-5 transition-all hover:bg-rose-500/10 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/20">
                  {item.topic.cefrLevel}
                </span>
                <h3 className="mt-2 text-[17px] font-black text-white truncate group-hover:text-rose-200 transition-colors">
                  {item.topic.titleEn}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-rose-300/40 line-clamp-1">
                  {item.topic.titleRu}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[20px] font-black text-rose-400">{item.score}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/5 mr-4">
                <div
                  className="h-full bg-rose-500 transition-all duration-1000"
                  style={{ width: `${Math.max(10, (item.score + 100) / 2)}%` }}
                />
              </div>
              <ArrowRight size={16} className="text-rose-400/50 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

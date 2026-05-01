"use client"

import React from "react"
import { motion } from "framer-motion"
import type { GrammarSkillRecord } from "@/lib/types"
import { GrammarTopicCard } from "./GrammarTopicCard"
import { Search } from "lucide-react"

export function GrammarTopicList({ items }: { items: GrammarSkillRecord[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-white/20 mb-6">
          <Search size={32} />
        </div>
        <h3 className="text-[20px] font-black text-white">No topics found</h3>
        <p className="mt-2 text-[15px] text-white/40 max-w-xs">
          Try adjusting your filters or search query to find what you're looking for.
        </p>
      </div>
    )
  }

  // Group by CEFR
  const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]
  const grouped = levels.map(level => ({
    level,
    items: items.filter(i => i.topic.cefrLevel === level)
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-10 px-4 md:px-0">
      {grouped.map((group) => (
        <div key={group.level} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-[12px] font-black text-blue-400 border border-blue-500/20">
              {group.level}
            </span>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {group.items.map((item, i) => (
              <GrammarTopicCard key={item.topic.id} item={item} index={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

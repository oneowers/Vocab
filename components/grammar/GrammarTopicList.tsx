"use client"

import React from "react"
import { Search } from "lucide-react"
import type { CefrLevel, GrammarSkillRecord } from "@/lib/types"
import { GrammarTopicRow } from "./GrammarTopicRow"

export function GrammarTopicList({ items }: { items: GrammarSkillRecord[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/10 mb-6">
          <Search size={24} />
        </div>
        <h3 className="text-[18px] font-black text-white">No topics found</h3>
        <p className="mt-1 text-[14px] text-white/30 max-w-xs">
          Try adjusting your filters or search query.
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
    <div className="space-y-6 px-4 pb-20 md:px-0">
      {grouped.map((group) => (
        <div key={group.level} className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              {group.level}
            </span>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>
          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            {group.items.map((item, i) => (
              <GrammarTopicRow key={item.topic.id} item={item} index={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

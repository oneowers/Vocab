"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { 
  BookOpen, 
  CheckCircle2, 
  History, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Zap,
  ChevronRight,
  ArrowRight
} from "lucide-react"
import { motion } from "framer-motion"

import type { 
  CefrLevel, 
  GrammarSkillRecord, 
  GrammarSkillsPayload 
} from "@/lib/types"

import { GrammarStatsCompact } from "./GrammarStatsCompact"
import { RecommendedTopicCard } from "./RecommendedTopicCard"
import { GrammarTopicList } from "./GrammarTopicList"
import { GrammarFilters } from "./GrammarFilters"

interface GrammarViewProps {
  payload: GrammarSkillsPayload
}

export type GrammarFilterType = "all" | "weak" | "learning" | "strong" | "no_data"
export type GrammarSortType = "priority" | "weakest" | "recent" | "cefr"

export function GrammarView({ payload }: GrammarViewProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<GrammarFilterType>("all")
  const [cefrFilter, setCefrFilter] = useState<CefrLevel | "all">("all")
  const [sort, setSort] = useState<GrammarSortType>("priority")

  // Smart Sorting Priority Logic
  const getPriority = (item: GrammarSkillRecord) => {
    const score = item.score
    const mistakeCount = item.negativeEvidenceCount
    
    let daysSinceLast = 0
    if (item.lastDetectedAt) {
      const last = new Date(item.lastDetectedAt).getTime()
      const now = Date.now()
      daysSinceLast = (now - last) / (1000 * 60 * 60 * 24)
    }

    return Math.max(0, -score) + (mistakeCount * 2) + (daysSinceLast * 0.2)
  }

  const sortedAndFilteredItems = useMemo(() => {
    return payload.items
      .filter(item => {
        const matchesSearch = 
          item.topic.titleEn.toLowerCase().includes(search.toLowerCase()) ||
          item.topic.titleRu.toLowerCase().includes(search.toLowerCase())
        
        const matchesCefr = cefrFilter === "all" || item.topic.cefrLevel === cefrFilter

        let matchesFilter = true
        if (filter === "weak") matchesFilter = item.score < -30
        if (filter === "learning") matchesFilter = item.score >= -30 && item.score < 30
        if (filter === "strong") matchesFilter = item.score >= 30
        if (filter === "no_data") matchesFilter = item.evidenceCount === 0

        return matchesSearch && matchesCefr && matchesFilter
      })
      .sort((a, b) => {
        if (sort === "priority") return getPriority(b) - getPriority(a)
        if (sort === "weakest") return a.score - b.score
        if (sort === "recent") {
          if (!a.lastDetectedAt) return 1
          if (!b.lastDetectedAt) return -1
          return new Date(b.lastDetectedAt).getTime() - new Date(a.lastDetectedAt).getTime()
        }
        if (sort === "cefr") {
          const levels: Record<CefrLevel, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }
          return levels[a.topic.cefrLevel] - levels[b.topic.cefrLevel]
        }
        return 0
      })
  }, [payload.items, search, filter, cefrFilter, sort])

  const mainRecommended = useMemo(() => {
    const items = payload.items
      .filter(item => item.score < 0)
      .sort((a, b) => getPriority(b) - getPriority(a))
    return items.length > 0 ? items[0] : null
  }, [payload.items])

  return (
    <div className="mx-auto max-w-5xl pb-32 md:pb-20">
      {/* Header - Minimal & Compact */}
      <header className="px-4 pb-2 pt-4 md:px-0 md:pb-6 md:pt-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-0">
            <h1 className="text-[24px] font-black tracking-tight text-white md:text-[40px]">
              Grammar
            </h1>
            <p className="text-[12px] font-bold text-white/30 md:text-[15px] md:text-white/40">
              Practice weak topics and improve with AI.
            </p>
          </div>
          <div className="hidden md:flex">
            <Link href="/practice" className="button-primary h-11 px-6 text-[14px]">
              <Sparkles size={16} />
              Start Practice
            </Link>
          </div>
        </div>
      </header>

      {/* Primary Mobile CTA */}
      <div className="mb-4 px-4 md:hidden">
        <Link 
          href="/practice" 
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-black shadow-lg active:scale-[0.98] transition-transform"
        >
          <Sparkles size={18} />
          Start Practice
        </Link>
      </div>

      <div className="space-y-5 md:space-y-10">
        {/* Recommended Section - Compact */}
        {mainRecommended && (
          <section className="space-y-2 px-4 md:px-0">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-amber-400" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-amber-400/50">Next for you</h2>
            </div>
            <RecommendedTopicCard item={mainRecommended} />
          </section>
        )}

        {/* Compact Stats */}
        <section className="px-4 md:px-0">
          <GrammarStatsCompact payload={payload} />
        </section>

        {/* Topic Library */}
        <section className="space-y-3">
          <div className="sticky top-0 z-20 space-y-3 bg-black/80 pb-2 pt-2 backdrop-blur-md md:static md:bg-transparent md:p-0 md:backdrop-blur-none">
            <div className="flex items-center justify-between px-4 md:px-0">
              <h2 className="text-[18px] font-black text-white md:text-[22px]">Topic Library</h2>
              <span className="text-[11px] font-bold text-white/20 uppercase tracking-widest">{payload.items.length} topics</span>
            </div>

            <GrammarFilters 
              search={search}
              onSearchChange={setSearch}
              filter={filter}
              onFilterChange={setFilter}
              cefrFilter={cefrFilter}
              onCefrFilterChange={setCefrFilter}
              sort={sort}
              onSortChange={setSort}
            />
          </div>

          <GrammarTopicList items={sortedAndFilteredItems} />
        </section>
      </div>
    </div>
  )
}

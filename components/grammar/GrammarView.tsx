"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { 
  BookOpen, 
  CheckCircle2, 
  History, 
  PenTool, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Zap,
  ChevronDown,
  Filter,
  LayoutGrid
} from "lucide-react"
import { motion } from "framer-motion"

import type { 
  CefrLevel, 
  GrammarSkillRecord, 
  GrammarSkillsPayload 
} from "@/lib/types"

import { GrammarStatsSummary } from "./GrammarStatsSummary"
import { RecommendedGrammarTopics } from "./RecommendedGrammarTopics"
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

  const recommendedItems = useMemo(() => {
    return payload.items
      .filter(item => item.score < 0)
      .sort((a, b) => getPriority(b) - getPriority(a))
      .slice(0, 3)
  }, [payload.items])

  return (
    <div className="relative mx-auto max-w-5xl pb-32">
      {/* Header */}
      <header className="px-4 pt-4 md:px-0 md:pt-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-[28px] font-black tracking-tight text-white md:text-[44px]">
              Grammar
            </h1>
            <p className="max-w-xl text-[14px] leading-relaxed text-white/40 md:text-[16px] md:text-white/50">
              Your weak grammar topics, practice rules, and AI feedback.
            </p>
          </div>
          <div className="hidden md:flex">
            <Link href="/practice" className="button-primary h-12 px-8">
              <Sparkles size={18} />
              Start Grammar Practice
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Primary CTA */}
      <div className="mt-6 px-4 md:hidden">
        <Link 
          href="/practice" 
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-black shadow-lg active:scale-[0.98] transition-transform"
        >
          <Sparkles size={20} />
          Start Grammar Practice
        </Link>
      </div>

      <div className="mt-8 space-y-10 md:mt-12 md:space-y-16">
        {/* Recommended Topics - Higher Priority on Mobile */}
        {recommendedItems.length > 0 && (
          <RecommendedGrammarTopics items={recommendedItems} />
        )}

        {/* Stats Summary */}
        <section className="space-y-4">
          <div className="px-4 md:hidden">
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-white/30">Your Progress</h2>
          </div>
          <GrammarStatsSummary payload={payload} />
        </section>

        {/* Main Content Area / Topic Library */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-4 md:px-0">
            <h2 className="text-[20px] font-black text-white md:text-[24px]">Topic Library</h2>
            <span className="text-[13px] font-bold text-white/30">{sortedAndFilteredItems.length} topics</span>
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

          <GrammarTopicList items={sortedAndFilteredItems} />
        </section>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-[72px] left-0 right-0 z-30 px-4 pb-4 md:hidden">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto"
        >
          <Link 
            href="/practice" 
            className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-black shadow-[0_8px_30px_rgb(0,0,0,0.4)] active:scale-[0.98] transition-transform"
          >
            <Sparkles size={20} />
            Start Grammar Practice
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

"use client"

import React, { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { 
  Search, 
  Sparkles, 
  X,
  ChevronDown
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import type { 
  CefrLevel, 
  GrammarSkillRecord, 
  GrammarSkillsPayload 
} from "@/lib/types"

import { GrammarStatsRow } from "./GrammarStatsRow"
import { RecommendedTopicCard } from "./RecommendedTopicCard"
import { GrammarTopicList } from "./GrammarTopicList"
import { GrammarFilters } from "./GrammarFilters"
import { GrammarLessonView } from "../GrammarLessonView"
import { GrammarTrendChart } from "./GrammarTrendChart"

interface GrammarViewProps {
  payload: GrammarSkillsPayload
}

export type GrammarFilterType = "all" | "weak" | "learning" | "strong" | "no_data"
export type GrammarSortType = "priority" | "weakest" | "recent" | "cefr"

export function GrammarView({ payload }: GrammarViewProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<GrammarFilterType>("all")
  const [cefrFilter, setCefrFilter] = useState<CefrLevel | "all">("all")
  const [sort, setSort] = useState<GrammarSortType>("weakest")
  
  const [showIntro, setShowIntro] = useState<boolean | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  const [showNoInfo, setShowNoInfo] = useState(false)

  useEffect(() => {
    const visits = parseInt(localStorage.getItem("grammar_visits") || "0")
    const dismissed = localStorage.getItem("grammar_intro_dismissed") === "true"
    
    if (dismissed || visits >= 3) {
      setShowIntro(false)
    } else {
      setShowIntro(true)
      localStorage.setItem("grammar_visits", (visits + 1).toString())
    }
  }, [])

  const handleDismissIntro = () => {
    localStorage.setItem("grammar_intro_dismissed", "true")
    setShowIntro(false)
  }

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

  const { activeItems, noInfoItems } = useMemo(() => {
    const sorted = payload.items
      .filter(item => {
        const matchesSearch = 
          item.topic.titleEn.toLowerCase().includes(search.toLowerCase()) ||
          item.topic.titleRu.toLowerCase().includes(search.toLowerCase())
        
        const matchesCefr = cefrFilter === "all" || item.topic.cefrLevel === cefrFilter

        const matchesFilter = (() => {
          if (filter === "weak") return item.score < -30
          if (filter === "learning") return item.score >= -30 && item.score < 30
          if (filter === "strong") return item.score >= 30
          if (filter === "no_data") return item.evidenceCount === 0
          return true
        })()

        const hasContent = !!item.topic.formulas
        
        return matchesSearch && matchesCefr && matchesFilter && hasContent
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

    return {
      activeItems: sorted.filter(i => i.evidenceCount > 0),
      noInfoItems: sorted.filter(i => i.evidenceCount === 0)
    }
  }, [payload.items, search, filter, cefrFilter, sort])

  const mainRecommended = useMemo(() => {
    const items = payload.items
      .filter(item => item.score < 0)
      .sort((a, b) => getPriority(b) - getPriority(a))
    return items.length > 0 ? items[0] : null
  }, [payload.items])

  if (selectedTopic) {
    return (
      <GrammarLessonView 
        topic={selectedTopic} 
        onBack={() => setSelectedTopic(null)} 
      />
    )
  }

  if (showIntro === null) return null

  return (
    <div className="mx-auto max-w-5xl pb-32 relative">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.header
            key="intro"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative px-4 pb-6 pt-0 md:px-0 md:pt-2"
          >
            <button 
              onClick={handleDismissIntro}
              className="absolute right-4 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/20 transition hover:bg-white/10 hover:text-white/40 md:hidden"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h1 className="text-[32px] font-black tracking-tight text-white md:text-[44px]">
                  Grammar
                </h1>
                <p className="max-w-xs text-[14px] font-medium text-white/40 md:max-w-xl md:text-[16px] md:text-white/50">
                  Study theory and explore English structures.
                </p>
              </div>
              <Link href="/practice?mode=grammar" className="button-primary h-12 px-8">
                <Sparkles size={18} />
                Go to Practice
              </Link>
            </div>
          </motion.header>
        ) : (
          <motion.header
            key="compact"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-4 pt-0 md:px-0 md:pt-2"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h1 className="text-[20px] font-black tracking-tight text-white md:text-[32px]">
                  Grammar Hub
                </h1>
                <GrammarStatsRow payload={payload} />
              </div>
              <Link 
                href="/practice?mode=grammar" 
                className="flex h-10 items-center gap-2 rounded-xl bg-white/5 px-4 text-[13px] font-black text-white border border-white/5 active:scale-[0.98] transition-transform md:h-12 md:px-6"
              >
                <Sparkles size={14} className="text-white/40 md:w-4 md:h-4" />
                <span>Practice</span>
              </Link>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="mt-4 space-y-8 md:mt-12 md:space-y-16">
        {/* Trend Chart */}
        {payload.trend && payload.trend.length > 0 && (
          <section className="px-4 md:px-0">
            <GrammarTrendChart data={payload.trend} />
          </section>
        )}

        {/* Recommended Section */}
        {mainRecommended && (
          <section className="space-y-3 px-4 md:px-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-amber-400/60">Recommendation</h2>
              </div>
            </div>
            <RecommendedTopicCard 
              item={mainRecommended} 
              onClick={() => setSelectedTopic(mainRecommended.topic)}
            />
          </section>
        )}

        {/* Topic Library */}
        <section className="space-y-4">
          <div className="sticky top-0 z-20 space-y-4 bg-[#0a0c10]/90 pb-3 pt-2 backdrop-blur-md md:static md:bg-transparent md:p-0 md:backdrop-blur-none">
            <div className="flex items-center justify-between px-4 md:px-0">
              <h2 className="text-[18px] font-black text-white md:text-[24px]">Topic Library</h2>
              <span className="text-[12px] font-bold text-white/30">{payload.items.length} topics</span>
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

          <GrammarTopicList 
            items={activeItems} 
            onSelect={(item) => setSelectedTopic(item.topic)}
          />

          {/* Collapsible No Info Section */}
          {noInfoItems.length > 0 && (
            <div className="px-4 md:px-0 pt-4">
              <button
                onClick={() => setShowNoInfo(!showNoInfo)}
                className="flex items-center gap-3 w-full py-4 border-t border-white/5 group"
              >
                <div className={`transition-transform duration-300 ${showNoInfo ? 'rotate-180' : ''}`}>
                  <ChevronDown size={18} className="text-white/20 group-hover:text-white/40" />
                </div>
                <span className="text-[13px] font-black text-white/20 group-hover:text-white/40 uppercase tracking-widest">
                  {showNoInfo ? 'Hide' : 'Show'} {noInfoItems.length} New Topics
                </span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </button>

              <AnimatePresence>
                {showNoInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4">
                      <GrammarTopicList 
                        items={noInfoItems} 
                        onSelect={(item) => setSelectedTopic(item.topic)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  )
}

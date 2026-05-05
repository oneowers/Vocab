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
  GrammarSummaryPayload,
  GrammarSkillRecord, 
  GrammarSkillsPayload 
} from "@/lib/types"

import { RecommendedTopicCard } from "./RecommendedTopicCard"
import { GrammarTopicList } from "./GrammarTopicList"
import { GrammarLessonView } from "../GrammarLessonView"
import { GrammarTrendChart } from "./GrammarTrendChart"
import { AppleHeader, AppleCard } from "@/components/AppleDashboardComponents"
import { Skeleton, SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"

interface GrammarViewProps {
  payload: GrammarSkillsPayload | null
  summary?: GrammarSummaryPayload | null
  topicsLoading?: boolean
}

export type GrammarFilterType = "all" | "weak" | "learning" | "strong" | "no_data"
export type GrammarSortType = "priority" | "weakest" | "recent" | "cefr"

export function GrammarView({ payload, summary = null, topicsLoading = false }: GrammarViewProps) {
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  const [showNoInfo, setShowNoInfo] = useState(false)
  const [showIntro, setShowIntro] = useState<boolean | null>(null)

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

  const items = payload?.items ?? []
  const trend = summary?.trend ?? payload?.trend ?? []

  const { activeItems, noInfoItems } = useMemo(() => {
    return {
      activeItems: items.filter(i => i.evidenceCount > 0),
      noInfoItems: items.filter(i => i.evidenceCount === 0)
    }
  }, [items])

  const mainRecommended = useMemo(() => {
    if (summary?.recommendedTopic) {
      return summary.recommendedTopic
    }

    const recommendedItems = items
      .filter(item => item.score < 0)
      .sort((a, b) => getPriority(b) - getPriority(a))
    return recommendedItems.length > 0 ? recommendedItems[0] : null
  }, [items, summary])

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
    <div className="min-h-screen bg-black pb-32">
      <div className="pt-20 px-4 space-y-6">
        {/* Statistics & Trend */}
        {trend.length > 0 && (
          <section>
             <AppleCard>
                <div className="p-4">
                   <GrammarTrendChart data={trend} />
                </div>
             </AppleCard>
          </section>
        )}

        {/* Recommended */}
        {mainRecommended && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
               <h2 className="text-[13px] font-black uppercase tracking-widest text-white/30">Recommended</h2>
            </div>
            <RecommendedTopicCard 
              item={mainRecommended} 
              onClick={() => setSelectedTopic(mainRecommended.topic)}
            />
          </section>
        )}

        {/* Library */}
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-[13px] font-black uppercase tracking-widest text-white/30">Topic Library</h2>
               <span className="text-[12px] font-bold text-white/20">{summary?.totalTopics ?? items.length} items</span>
            </div>
          </div>

          {topicsLoading && items.length === 0 ? (
            <GrammarLibrarySkeleton />
          ) : (
            <div className="overflow-hidden">
              <GrammarTopicList 
                  items={activeItems} 
                  onSelect={(item) => setSelectedTopic(item.topic)}
              />
            </div>
          )}

          {/* New Topics */}
          {!topicsLoading && noInfoItems.length > 0 && (
            <div className="pt-4">
              <button
                onClick={() => setShowNoInfo(!showNoInfo)}
                className="flex items-center gap-3 w-full py-4 px-1 group"
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
                    className="overflow-hidden mt-4"
                  >
                    <GrammarTopicList 
                      items={noInfoItems} 
                      onSelect={(item) => setSelectedTopic(item.topic)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

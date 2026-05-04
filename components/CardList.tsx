"use client"

import { useEffect, useRef, useState } from "react"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { getTooltipMessage } from "@/lib/config"
import { matchesCardStatus } from "@/lib/spaced-repetition"
import { speakText } from "@/lib/tts"
import type { CardRecord, CardStatusFilter, CefrLevel } from "@/lib/types"
import { getTodayDateKey } from "@/lib/date"
import { Check, Clock, Download, Ellipsis, Layers, Trash2, Upload, X } from "lucide-react"
import { CardDetailsModal } from "./CardDetailsModal"

const CEFR_STYLES: Record<CefrLevel, { badge: string; dot: string }> = {
  A1: {
    badge: "bg-[#30D158]/10 text-[#30D158]",
    dot: "text-[#30D158]"
  },
  A2: {
    badge: "bg-[#30D158]/15 text-[#30D158]",
    dot: "text-[#30D158]"
  },
  B1: {
    badge: "bg-[#0A84FF]/10 text-[#0A84FF]",
    dot: "text-[#0A84FF]"
  },
  B2: {
    badge: "bg-[#0A84FF]/15 text-[#0A84FF]",
    dot: "text-[#0A84FF]"
  },
  C1: {
    badge: "bg-[#BF5AF2]/10 text-[#BF5AF2]",
    dot: "text-[#BF5AF2]"
  },
  C2: {
    badge: "bg-[#FF453A]/10 text-[#FF453A]",
    dot: "text-[#FF453A]"
  }
}

interface CardListProps {
  cards: CardRecord[]
  refreshing?: boolean
  selectedStatus: CardStatusFilter
  onSelectStatus: (status: CardStatusFilter) => void
  selectedLevel: CefrLevel | "All"
  onSelectLevel: (level: CefrLevel | "All") => void
  search: string
  onSearchChange: (value: string) => void
  onExport: () => void
  onImport: () => void
  onDeleteRequest: (card: CardRecord) => void
  onDeleteManyRequest: (cards: CardRecord[]) => void
  guestMode: boolean
  waitingCount: number
  learnedCount: number
  totalCount: number
}

export function CardList({
  cards,
  refreshing = false,
  selectedStatus,
  onSelectStatus,
  selectedLevel,
  onSelectLevel,
  search,
  onSearchChange,
  onExport,
  onImport,
  onDeleteRequest,
  onDeleteManyRequest,
  guestMode,
  waitingCount,
  learnedCount,
  totalCount
}: CardListProps) {
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null)
  const [inspectedCard, setInspectedCard] = useState<CardRecord | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeCardMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveCardMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [activeCardMenu])

  const renderEmptyState = () => {
    if (search.trim()) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="h-20 w-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
            <X size={32} className="text-white/20" />
          </div>
          <h3 className="text-[20px] font-black text-white tracking-tight">No matches found</h3>
          <p className="mt-2 text-[14px] font-bold text-white/30 max-w-[240px]">We couldn't find any cards matching your search.</p>
          <button
            onClick={() => { onSearchChange(""); onSelectLevel("All") }}
            className="mt-6 h-10 rounded-xl bg-white/5 px-6 text-[13px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            Clear filters
          </button>
        </div>
      )
    }

    if (selectedStatus === "Waiting") {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <Check size={32} className="text-emerald-400" />
          </div>
          <h3 className="text-[20px] font-black text-white tracking-tight">Victory!</h3>
          <p className="mt-2 text-[14px] font-bold text-white/30 max-w-[240px]">All cards have been reviewed for today. Great job!</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
          <Layers size={32} className="text-white/20" />
        </div>
        <h3 className="text-[20px] font-black text-white tracking-tight">Deck is empty</h3>
        <p className="mt-2 text-[14px] font-bold text-white/30 max-w-[240px]">Start adding cards from translations or practice sessions.</p>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      {/* Search & Tabs */}
      <div className="sticky top-0 z-40 -mx-4 bg-bg-primary/95 px-4 pb-2 pt-3 backdrop-blur-xl md:-mx-6 md:px-6 md:pt-4">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg className="h-5 w-5 text-white/20 transition-colors group-focus-within:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Find a word..."
              className="h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-11 pr-4 text-[15px] font-bold text-white placeholder:text-white/20 focus:bg-white/[0.06] focus:border-blue-500/30 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Level Filters - Horizontal Scroll */}
          <div className="hide-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
            {(["All", "A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className={`h-9 shrink-0 rounded-[10px] px-5 text-[13px] font-bold transition-all apple-spring ${selectedLevel === level
                  ? "bg-[#0A84FF] text-white shadow-[0_4px_12px_rgba(10,132,255,0.3)]"
                  : "bg-white/[0.04] text-white/30 border border-white/[0.08] hover:text-white/60"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex h-[52px] items-center rounded-[14px] bg-white/[0.04] border border-white/[0.08] p-1.5">
            {(["Waiting", "Learned", "All"] as const).map((status) => {
              const isActive = selectedStatus === status
              const count = status === "Waiting" ? waitingCount : status === "Learned" ? learnedCount : totalCount
              return (
                <button
                  key={status}
                  onClick={() => onSelectStatus(status as CardStatusFilter)}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-[10px] text-[15px] font-bold tracking-tight transition-all apple-spring ${isActive ? "text-white" : "text-white/30 hover:text-white/50"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-[10px] bg-white/[0.08] border border-white/[0.1] shadow-xl"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{status}</span>
                  <span className={`relative z-10 text-[12px] font-medium opacity-40 ${isActive ? "text-white/60" : ""}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid / List */}
      <div className={selectedStatus === "Learned" ? "divide-y divide-white/[0.03]" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
        {cards.length > 0 ? (
          cards.map((card) => {
            const isLearned = selectedStatus === "Learned"
            const menuActive = activeCardMenu === card.id

            if (isLearned) {
              return (
                <div
                  key={card.id}
                  className="group relative flex h-[72px] items-center justify-between px-2 transition-all hover:bg-white/[0.02] border-b border-white/[0.03] last:border-0"
                >
                  <div className="flex flex-1 items-center gap-4 min-w-0 cursor-pointer" onClick={() => setInspectedCard(card)}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/20 group-hover:bg-white/10 group-hover:text-white transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 5-7 7 7 7"></path><path d="M4 12h16"></path></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[17px] font-black text-white tracking-tight">{card.original}</h3>
                        {card.cefrLevel && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${CEFR_STYLES[card.cefrLevel].badge}`}>
                            {card.cefrLevel}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[13px] font-bold text-white/30">{card.translation}</p>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <button
                      onClick={() => setActiveCardMenu(menuActive ? null : card.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-white/5"
                    >
                      <Ellipsis size={18} />
                    </button>

                    <AnimatePresence>
                      {menuActive && (
                        <motion.div
                          ref={menuRef}
                          initial={{ opacity: 0, scale: 0.9, x: 10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: 10 }}
                          className="absolute right-9 top-0 z-50 rounded-2xl bg-bg-tertiary p-1.5 shadow-2xl border border-line"
                        >
                          <button
                            onClick={() => { onDeleteRequest(card); setActiveCardMenu(null) }}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            }

            return (
              <article
                key={card.id}
                onClick={() => setInspectedCard(card)}
                className="liquid-glass group relative overflow-hidden p-6 apple-spring cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex flex-col gap-1.5 pr-8">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[22px] font-bold tracking-tight text-white">{card.original}</h3>
                    {card.cefrLevel && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px] ${CEFR_STYLES[card.cefrLevel].badge}`}>
                        {card.cefrLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-[15px] font-medium text-white/40">{card.translation}</p>
                  
                  {card.nextReviewDate <= getTodayDateKey() && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex h-6 items-center gap-2 rounded-full bg-[#0A84FF]/10 px-3 text-[10px] font-bold uppercase tracking-wider text-[#0A84FF]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
                        Ready for review
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute right-2 top-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveCardMenu(menuActive ? null : card.id) }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-white/5"
                  >
                    <Ellipsis size={18} />
                  </button>
                  <AnimatePresence>
                    {menuActive && (
                      <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        className="absolute right-0 top-9 z-50 min-w-[120px] rounded-2xl bg-bg-tertiary p-1.5 shadow-2xl border border-line"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteRequest(card); setActiveCardMenu(null) }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </article>
            )
          })
        ) : renderEmptyState()}
      </div>

      {/* Bottom Padding for Nav */}
      <div className="h-12 md:hidden" />

      <AnimatePresence>
        {inspectedCard && (
          <CardDetailsModal 
            card={inspectedCard} 
            onClose={() => setInspectedCard(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  )
}

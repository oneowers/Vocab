"use client"

import { useEffect, useRef, useState } from "react"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { getTooltipMessage } from "@/lib/config"
import { matchesCardStatus } from "@/lib/spaced-repetition"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, CardStatusFilter, CefrLevel } from "@/lib/types"
import { getTodayDateKey } from "@/lib/date"
import { Check, Clock, Download, Ellipsis, Layers, Trash2, Upload, X } from "lucide-react"

const CEFR_STYLES: Record<CefrLevel, { badge: string; dot: string }> = {
  A1: {
    badge: "bg-emerald-500/10 text-emerald-300",
    dot: "text-emerald-500"
  },
  A2: {
    badge: "bg-lime-500/10 text-lime-300",
    dot: "text-lime-500"
  },
  B1: {
    badge: "bg-sky-500/10 text-sky-300",
    dot: "text-sky-500"
  },
  B2: {
    badge: "bg-indigo-500/10 text-indigo-300",
    dot: "text-indigo-500"
  },
  C1: {
    badge: "bg-fuchsia-500/10 text-fuchsia-300",
    dot: "text-fuchsia-500"
  },
  C2: {
    badge: "bg-rose-500/10 text-rose-300",
    dot: "text-rose-500"
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
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="h-16 w-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
            <X size={24} className="text-text-tertiary" />
          </div>
          <h3 className="text-[17px] font-bold text-text-primary">No cards found</h3>
          <p className="mt-1 text-[14px] text-text-tertiary">Clear filters or try a different search term.</p>
          <button
            onClick={() => { onSearchChange(""); onSelectLevel("All") }}
            className="mt-4 text-[13px] font-bold text-blue-400"
          >
            Clear all filters
          </button>
        </div>
      )
    }

    if (selectedStatus === "Waiting") {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Check size={24} className="text-emerald-400" />
          </div>
          <h3 className="text-[17px] font-bold text-text-primary">All caught up</h3>
          <p className="mt-1 text-[14px] text-text-tertiary">No cards waiting for review right now.</p>
        </div>
      )
    }

    if (selectedStatus === "Learned") {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="h-16 w-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
            <Layers size={24} className="text-text-tertiary" />
          </div>
          <h3 className="text-[17px] font-bold text-text-primary">No learned cards yet</h3>
          <p className="mt-1 text-[14px] text-text-tertiary">Complete practice to mark words as learned.</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
          <Layers size={24} className="text-text-tertiary" />
        </div>
        <h3 className="text-[17px] font-bold text-text-primary">No saved cards yet</h3>
        <p className="mt-1 text-[14px] text-text-tertiary">Save words from translations or AI practice.</p>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      {/* Search & Tabs */}
      <div className="sticky top-0 z-40 -mx-4 bg-black/95 px-4 pb-2 pt-3 backdrop-blur-xl md:-mx-6 md:px-6 md:pt-4">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search saved cards"
              className="h-11 w-full rounded-2xl bg-white/[0.06] pl-10 pr-4 text-[14px] font-medium text-text-primary placeholder:text-text-tertiary focus:bg-white/[0.1] focus:outline-none transition-colors"
            />
          </div>

          {/* Level Filters - Horizontal Scroll */}
          <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
            {(["All", "A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className={`h-7 shrink-0 rounded-full px-3 text-[11px] font-black uppercase tracking-wider transition-all ${selectedLevel === level
                  ? "bg-white text-black"
                  : "bg-white/[0.05] text-text-tertiary hover:bg-white/[0.1] hover:text-text-secondary"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex h-11 items-center rounded-2xl bg-white/[0.04] p-1">
            {(["Waiting", "Learned", "All"] as const).map((status) => {
              const isActive = selectedStatus === status
              const count = status === "Waiting" ? waitingCount : status === "Learned" ? learnedCount : totalCount
              return (
                <button
                  key={status}
                  onClick={() => onSelectStatus(status as CardStatusFilter)}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-[13px] text-[13px] font-bold transition-all ${isActive ? "text-black" : "text-text-tertiary hover:text-text-secondary"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-[13px] bg-white"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{status}</span>
                  <span className={`relative z-10 text-[10px] opacity-60 ${isActive ? "text-black/60" : ""}`}>
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
                  className="group relative flex h-16 items-center justify-between px-1 transition-colors active:bg-white/[0.02]"
                >
                  <div className="flex flex-1 items-center gap-3 min-w-0" onClick={() => speakText(card.original, card.direction === "en-ru" ? "en-US" : "ru-RU")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[16px] font-bold text-text-primary">{card.original}</h3>
                        {card.cefrLevel && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${CEFR_STYLES[card.cefrLevel].badge}`}>
                            {card.cefrLevel}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[13px] text-text-tertiary">{card.translation}</p>
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
                          className="absolute right-9 top-0 z-50 rounded-2xl bg-[#1a1a20] p-1.5 shadow-2xl border border-white/10"
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
                onClick={() => speakText(card.original, card.direction === "en-ru" ? "en-US" : "ru-RU")}
                className="group relative rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4 transition-all active:scale-[0.98] active:bg-white/[0.05]"
              >
                <div className="flex flex-col gap-1 pr-8">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[20px] font-black tracking-tight text-text-primary">{card.original}</h3>
                    {card.cefrLevel && (
                      <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-lg ${CEFR_STYLES[card.cefrLevel].badge}`}>
                        {card.cefrLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] font-medium text-text-secondary">{card.translation}</p>
                  
                  {card.nextReviewDate <= getTodayDateKey() && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="flex h-5 items-center gap-1 rounded-full bg-amber-400/10 px-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
                        <Clock size={10} />
                        Waiting
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
                        className="absolute right-0 top-9 z-50 min-w-[120px] rounded-2xl bg-[#1a1a20] p-1.5 shadow-2xl border border-white/10"
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
    </section>
  )
}

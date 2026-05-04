"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import type { CardRecord, CardStatusFilter, CefrLevel } from "@/lib/types"
import { getTodayDateKey } from "@/lib/date"
import { Check, Clock, Download, Ellipsis, Layers, Trash2, Upload, X, SlidersHorizontal, Info, Mic } from "lucide-react"
import { CardDetailsModal } from "./CardDetailsModal"

interface CardListProps {
  cards: CardRecord[]
  selectedStatus: CardStatusFilter
  setSelectedStatus: (status: CardStatusFilter) => void
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
  selectedLevel,
  onSelectLevel,
  search,
  onSearchChange,
  onDeleteRequest
}: CardListProps) {
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [inspectedCard, setInspectedCard] = useState<CardRecord | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const filterRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveCardMenu(null)
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col bg-black min-h-screen -mx-4 px-4">
      {/* Search Bar Container */}
      <div className="sticky top-0 z-40 bg-black pb-3 pt-1">
        <div className="relative flex items-center group">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg className="h-4.5 w-4.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="h-[36px] w-full rounded-xl bg-[#1C1C1E] pl-10 pr-10 text-[17px] font-medium text-white placeholder:text-white/40 focus:outline-none transition-all"
          />
          <div className="absolute inset-y-0 right-3 flex items-center text-white/40">
            <Mic size={18} />
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="mt-2 divide-y divide-white/[0.08]">
        {cards.length > 0 ? (
          cards.map((card) => {
            const isDue = card.nextReviewDate <= getTodayDateKey()
            const menuActive = activeCardMenu === card.id
            const initials = card.original.slice(0, 1).toUpperCase()

            return (
              <div
                key={card.id}
                className="group relative flex items-center gap-4 py-3.5 active:bg-white/[0.05] transition-colors cursor-pointer"
                onClick={() => setInspectedCard(card)}
              >
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-[18px] font-bold text-white tracking-tight">
                      {card.original}
                    </h3>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveCardMenu(menuActive ? null : card.id)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/10 group-hover:text-white/20"
                      >
                        <Ellipsis size={18} />
                      </button>

                      <AnimatePresence>
                        {menuActive && (
                          <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.95, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: 10 }}
                            className="absolute right-9 top-0 z-50 min-w-[120px] rounded-xl bg-[#2C2C2E] p-1 border border-white/10 shadow-2xl"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteRequest(card)
                                setActiveCardMenu(null)
                              }}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-semibold text-rose-500 hover:bg-rose-500/10"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[15px] font-medium text-white/40 mt-1">
                    <span className="truncate">{card.translation}</span>
                    <span className="opacity-20">·</span>
                    <span className="whitespace-nowrap uppercase text-[12px] tracking-wide font-bold opacity-60">
                      {card.cefrLevel || "B2"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <h3 className="text-[17px] font-medium text-white/20">No cards found</h3>
          </div>
        )}
      </div>

      <AnimatePresence>
        {inspectedCard && (
          <CardDetailsModal
            card={inspectedCard}
            onClose={() => setInspectedCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

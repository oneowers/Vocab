"use client"

import { useEffect, useRef, useState } from "react"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { getTooltipMessage } from "@/lib/config"
import { matchesCardStatus } from "@/lib/spaced-repetition"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, CardStatusFilter, CefrLevel } from "@/lib/types"
import { Download, Ellipsis, Trash2, Upload, Volume2 } from "lucide-react"

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
  guestMode: boolean
  variant?: "list" | "grid"
  title?: string
  description?: string
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
  guestMode,
  variant = "list",
  title = "Your saved cards",
  description
}: CardListProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-black tracking-[-0.6px] text-text-primary md:text-[28px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
          ) : null}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#28282f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-[#303039]"
            aria-label="Deck actions"
            aria-expanded={menuOpen}
          >
            <Ellipsis size={18} />
          </button>

          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -4, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -3, scale: 0.99 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-1 top-[3.35rem] z-30 min-w-[172px] rounded-[26px] bg-[#202028]/98 p-2 shadow-[0_20px_44px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onExport()
                  }}
                  className="flex w-full items-center gap-3 rounded-[20px] px-3 py-2.5 text-left text-[14px] font-semibold text-text-primary transition hover:bg-white/[0.06]"
                >
                  <Download size={16} />
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onImport()
                  }}
                  disabled={guestMode}
                  title={guestMode ? getTooltipMessage() : "Import JSON"}
                  className="flex w-full items-center gap-3 rounded-[20px] px-3 py-2.5 text-left text-[14px] font-semibold text-text-primary transition hover:bg-white/[0.06] disabled:opacity-50"
                >
                  <Upload size={16} />
                  Import JSON
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="translate-card p-3 md:p-4">
        <AnimatePresence initial={false}>
          {refreshing ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="mb-3 flex items-center gap-2 rounded-[16px] bg-white/[0.05] px-3 py-2 text-[12px] font-semibold text-text-secondary"
            >
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Updating cards...
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg className="h-5 w-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              placeholder="Search saved cards"
              className="w-full rounded-[18px] bg-white/[0.06] py-2.5 pl-11 pr-4 text-[15px] font-medium text-text-primary placeholder-text-tertiary transition-all duration-300 focus:bg-white/[0.1] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(["All", "known"] as CardStatusFilter[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onSelectStatus(status)}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-all duration-300 ${selectedStatus === status
                    ? "bg-[#f2f2f4] text-black scale-105"
                    : "bg-white/[0.06] text-text-secondary hover:bg-white/[0.1] hover:text-text-primary"
                    }`}
                >
                  {status === "All"
                    ? "All cards"
                    : "Known"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["All", "A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onSelectLevel(level)}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-all duration-300 ${selectedLevel === level
                    ? "bg-[#f2f2f4] text-black scale-105"
                    : "bg-white/[0.06] text-text-secondary hover:bg-white/[0.1] hover:text-text-primary"
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          variant === "grid"
            ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            : "space-y-2"
        }
      >
        {cards.length ? (
          cards.map((card) => (
            <article
              key={card.id}
              onClick={() => {
                if (canSpeak()) {
                  speakText(
                    card.original,
                    card.direction === "en-ru" ? "en-US" : "ru-RU"
                  )
                }
              }}
              className={`group translate-card relative cursor-pointer overflow-hidden px-3 pb-2 transition-all duration-200 active:scale-[0.98] ${variant === "grid" ? "h-full min-h-[90px]" : ""
                }`}
            >
              <div
                className={`flex gap-3 ${variant === "grid"
                  ? "h-full flex-col justify-center pr-11"
                  : "min-h-[42px] flex-col justify-center pr-11 sm:flex-row sm:items-center sm:justify-between"
                  }`}
              >
                <div className="min-w-0">
                  <h3
                    className={`flex items-center gap-2 text-[25px] font-bold tracking-[-0.3px] ${matchesCardStatus(card, "known") && card.cefrLevel
                      ? `${CEFR_STYLES[card.cefrLevel].dot}`
                      : "text-text-primary"
                      }`}
                  >
                    <span className="truncate">{card.original}</span>
                    {card.cefrLevel ? (
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-tight ${CEFR_STYLES[card.cefrLevel].badge}`}
                      >
                        {card.cefrLevel}
                      </span>
                    ) : null}
                  </h3>
                  <div className="mt-0.5 flex items-center justify-between gap-3">
                    <p className="truncate text-[12px] font-medium text-text-secondary leading-snug">
                      {card.translation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteRequest(card)
                  }}
                  disabled={guestMode}
                  title={guestMode ? getTooltipMessage() : undefined}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/[0.05] text-text-tertiary transition-all duration-300 hover:scale-110 hover:bg-dangerBg hover:text-dangerText disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Delete ${card.original}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="translate-card col-span-full p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06]">
              <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-[18px] font-bold text-text-primary mb-1">No cards found</h3>
            <p className="text-[15px] text-text-secondary">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </section>
  )
}

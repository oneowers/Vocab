"use client"

import { getTooltipMessage } from "@/lib/config"
import { matchesCardStatus } from "@/lib/spaced-repetition"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, CardStatusFilter, CefrLevel } from "@/lib/types"
import { Trash2, Volume2 } from "lucide-react"

const CEFR_STYLES: Record<CefrLevel, { badge: string; dot: string; label: string }> = {
  A1: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-md",
    dot: "text-emerald-500",
    label: "Beginner"
  },
  A2: {
    badge: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border border-lime-500/20 backdrop-blur-md",
    dot: "text-lime-500",
    label: "Elementary"
  },
  B1: {
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 backdrop-blur-md",
    dot: "text-sky-500",
    label: "Intermediate"
  },
  B2: {
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md",
    dot: "text-indigo-500",
    label: "Upper-intermediate"
  },
  C1: {
    badge: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20 backdrop-blur-md",
    dot: "text-fuchsia-500",
    label: "Advanced"
  },
  C2: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 backdrop-blur-md",
    dot: "text-rose-500",
    label: "Mastery"
  }
}

interface CardListProps {
  cards: CardRecord[]
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
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-widest text-text-tertiary">Deck</p>
          <h2 className="mt-1 text-[28px] lg:text-[32px] font-extrabold tracking-[-0.8px] text-text-primary">{title}</h2>
          {description ? (
            <p className="mt-1.5 text-[16px] text-text-secondary leading-relaxed">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onExport} className="px-5 py-2.5 rounded-[18px] bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 text-[15px] font-semibold text-text-primary shadow-sm transition-all duration-300 hover:scale-105 hover:bg-white/80 dark:hover:bg-black/60 active:scale-95">
            Export JSON
          </button>
          <button
            type="button"
            onClick={onImport}
            disabled={guestMode}
            title={guestMode ? getTooltipMessage() : undefined}
            className="px-5 py-2.5 rounded-[18px] bg-black dark:bg-white text-white dark:text-black text-[15px] font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            Import JSON
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {(["All", "known", "unknown"] as CardStatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onSelectStatus(status)}
                className={`px-4 py-1.5 text-[14px] font-semibold rounded-[16px] transition-all duration-300 ${selectedStatus === status
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-md scale-105"
                  : "bg-black/5 dark:bg-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/20 hover:text-text-primary"
                  }`}
              >
                {status === "All"
                  ? "All"
                  : status === "known"
                    ? "Known"
                    : "Unknown"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["All", "A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onSelectLevel(level)}
                className={`px-4 py-1.5 text-[14px] font-semibold rounded-[16px] transition-all duration-300 ${selectedLevel === level
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-md scale-105"
                  : "bg-black/5 dark:bg-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/20 hover:text-text-primary"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
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
            placeholder="Search words..."
            className="w-full rounded-[20px] bg-black/5 dark:bg-white/5 py-3 pl-11 pr-4 text-[16px] font-medium text-text-primary placeholder-text-tertiary backdrop-blur-xl transition-all duration-300 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 shadow-inner"
          />
        </div>
      </div>

      <div
        className={
          variant === "grid"
            ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            : "space-y-3"
        }
      >
        {cards.length ? (
          cards.map((card) => (
            <article
              key={card.id}
              className={`group relative overflow-hidden rounded-[28px] bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-black/[0.04] dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-400 ease-out hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] ${variant === "grid" ? "h-full min-h-[140px]" : ""
                }`}
            >
              <div
                className={`flex gap-3 ${variant === "grid"
                  ? "h-full flex-col justify-between pr-11"
                  : "flex-col pr-11 sm:flex-row sm:items-center sm:justify-between"
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3
                      className={`truncate text-[20px] font-bold tracking-[-0.6px] ${matchesCardStatus(card, "known") && card.cefrLevel
                        ? `${CEFR_STYLES[card.cefrLevel].dot}`
                        : "text-text-primary"
                        }`}
                    >
                      {card.original}
                    </h3>
                    {canSpeak() ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          speakText(
                            card.original,
                            card.direction === "en-ru" ? "en-US" : "ru-RU"
                          )
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-text-secondary transition-all duration-300 hover:scale-110 hover:bg-black/10 dark:hover:bg-white/20 hover:text-accent"
                        aria-label={`Speak ${card.original}`}
                      >
                        <Volume2 size={14} />
                      </button>
                    ) : null}
                  </div>
                  {card.cefrLevel ? (
                    <div className="pt-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${CEFR_STYLES[card.cefrLevel].badge}`}
                      >
                        {card.cefrLevel} · {CEFR_STYLES[card.cefrLevel].label}
                      </span>
                    </div>
                  ) : null}
                  <p className="mt-2 truncate text-[15px] font-medium text-text-secondary leading-snug">{card.translation}</p>
                  <p className="mt-1.5 text-[13px] font-semibold tracking-wide text-text-tertiary uppercase">
                    {matchesCardStatus(card, "known") ? "Known" : "Learning"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteRequest(card)
                }}
                disabled={guestMode}
                title={guestMode ? getTooltipMessage() : undefined}
                className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-text-tertiary backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-dangerBg hover:text-dangerText disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Delete ${card.original}`}
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))
        ) : (
          <div className="col-span-full rounded-[32px] border-2 border-dashed border-black/5 dark:border-white/10 bg-white/40 dark:bg-black/20 p-12 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 mb-4">
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

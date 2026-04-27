"use client"

import { getTooltipMessage } from "@/lib/config"
import { matchesCardStatus } from "@/lib/spaced-repetition"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, CardStatusFilter, CefrLevel } from "@/lib/types"
import { Trash2, Volume2 } from "lucide-react"

const CEFR_STYLES: Record<CefrLevel, { badge: string; dot: string; label: string }> = {
  A1: {
    badge: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
    dot: "text-emerald-500",
    label: "Beginner"
  },
  A2: {
    badge: "border-lime-200 bg-lime-500/10 text-lime-700",
    dot: "text-lime-500",
    label: "Elementary"
  },
  B1: {
    badge: "border-sky-200 bg-sky-500/10 text-sky-700",
    dot: "text-sky-500",
    label: "Intermediate"
  },
  B2: {
    badge: "border-indigo-200 bg-indigo-500/10 text-indigo-700",
    dot: "text-indigo-500",
    label: "Upper-intermediate"
  },
  C1: {
    badge: "border-fuchsia-200 bg-fuchsia-500/10 text-fuchsia-700",
    dot: "text-fuchsia-500",
    label: "Advanced"
  },
  C2: {
    badge: "border-rose-200 bg-rose-500/10 text-rose-700",
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label">Deck</p>
          <h2 className="mt-2 text-[22px] font-bold tracking-[-0.5px] text-text-primary">{title}</h2>
          {description ? (
            <p className="mt-2 text-[15px] text-text-secondary">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onExport} className="button-secondary">
            Export JSON
          </button>
          <button
            type="button"
            onClick={onImport}
            disabled={guestMode}
            title={guestMode ? getTooltipMessage() : undefined}
            className="button-secondary"
          >
            Import JSON
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {(["All", "known", "unknown"] as CardStatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onSelectStatus(status)}
                className="chip-button"
                data-active={selectedStatus === status}
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
                className="chip-button"
                data-active={selectedLevel === level}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          placeholder="Search word or translation"
          className="input-field w-full max-w-sm"
        />
      </div>

      <div
        className={
          variant === "grid"
            ? "grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
            : "space-y-2"
        }
      >
        {cards.length ? (
          cards.map((card) => (
            <article
              key={card.id}
              className={`relative rounded-card bg-bg-primary px-3 py-2.5 transition hover:-translate-y-0.5 ${variant === "grid" ? "h-full min-h-[112px]" : ""
                }`}
            >
              <div
                className={`flex gap-3 ${variant === "grid"
                  ? "h-full flex-col justify-between pr-11"
                  : "flex-col pr-11 sm:flex-row sm:items-center sm:justify-between"
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`truncate text-[18px] font-bold tracking-[-0.4px] ${matchesCardStatus(card, "known") && card.cefrLevel
                        ? `${CEFR_STYLES[card.cefrLevel].dot}`
                        : "text-text-primary"
                        }`}
                    >
                      {card.original}
                    </h3>
                    {canSpeak() ? (
                      <button
                        type="button"
                        onClick={() =>
                          speakText(
                            card.original,
                            card.direction === "en-ru" ? "en-US" : "ru-RU"
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-secondary text-text-secondary transition hover:bg-bg-primary hover:text-accent"
                        aria-label={`Speak ${card.original}`}
                      >
                        <Volume2 size={16} />
                      </button>
                    ) : null}
                  </div>
                  {card.cefrLevel ? (
                    <div className="pt-1">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${CEFR_STYLES[card.cefrLevel].badge}`}
                      >
                        {card.cefrLevel} · {CEFR_STYLES[card.cefrLevel].label}
                      </span>
                    </div>
                  ) : null}
                  <p className="mt-1 truncate text-[14px] text-text-secondary">{card.translation}</p>
                  <p className="mt-1 text-[12px] font-medium text-text-tertiary">
                    {matchesCardStatus(card, "known") ? "Known" : "Unknown"}
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
                className="absolute right-2.5 top-2.5 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-separator bg-bg-secondary text-dangerText transition hover:border-transparent hover:bg-dangerBg disabled:cursor-not-allowed disabled:border-separator disabled:bg-bg-secondary disabled:text-text-tertiary"
                aria-label={`Delete ${card.original}`}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))
        ) : (
          <div className="rounded-card border border-dashed border-separator bg-bg-primary px-5 py-10 text-center text-[15px] text-text-secondary">
            No cards match this filter yet.
          </div>
        )}
      </div>
    </section>
  )
}

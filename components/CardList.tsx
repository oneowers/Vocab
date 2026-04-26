"use client"

import { getTooltipMessage } from "@/lib/config"
import { formatDateLabel } from "@/lib/date"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord } from "@/lib/types"
import { Trash2, Volume2 } from "lucide-react"

interface CardListProps {
  cards: CardRecord[]
  tags: string[]
  selectedTag: string
  onSelectTag: (tag: string) => void
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
  tags,
  selectedTag,
  onSelectTag,
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
    <section className="panel p-5">
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectTag("All")}
            className="chip-button"
            data-active={selectedTag === "All"}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSelectTag(tag)}
              className="chip-button"
              data-active={selectedTag === tag}
            >
              {tag}
            </button>
          ))}
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
            ? "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            : "mt-5 space-y-3"
        }
      >
        {cards.length ? (
          cards.map((card) => (
            <article
              key={card.id}
              className={`rounded-card border border-separator bg-bg-primary px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-panel ${
                variant === "grid" ? "h-full min-h-[144px]" : ""
              }`}
            >
              <div
                className={`flex gap-3 ${
                  variant === "grid"
                    ? "h-full flex-col justify-between"
                    : "flex-col sm:flex-row sm:items-center sm:justify-between"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[18px] font-bold tracking-[-0.4px] text-text-primary">
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
                  <p className="mt-1 truncate text-[14px] text-text-secondary">{card.translation}</p>
                </div>

                <div
                  className={`flex items-center gap-3 ${
                    variant === "grid" ? "justify-between" : "justify-between sm:justify-end"
                  }`}
                >
                  <p className="text-[13px] text-text-tertiary">
                    {formatDateLabel(card.nextReviewDate)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(card)}
                    disabled={guestMode}
                    title={guestMode ? getTooltipMessage() : undefined}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-dangerBg text-dangerText transition hover:opacity-85 disabled:bg-bg-secondary disabled:text-text-tertiary"
                    aria-label={`Delete ${card.original}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
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

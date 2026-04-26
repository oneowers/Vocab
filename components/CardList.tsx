"use client"

import { getTooltipMessage } from "@/lib/config"
import { formatDateLabel } from "@/lib/date"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord } from "@/lib/types"

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
  guestMode
}: CardListProps) {
  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label">Deck</p>
          <h2 className="mt-2 text-[22px] font-bold tracking-[-0.5px] text-text-primary">Your saved cards</h2>
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

      <div className="mt-5 space-y-3">
        {cards.length ? (
          cards.map((card) => (
            <article
              key={card.id}
              className="rounded-card border border-separator bg-bg-primary p-4 transition hover:-translate-y-0.5 hover:shadow-panel"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-[22px] font-bold tracking-[-0.5px] text-text-primary">{card.original}</h3>
                    {canSpeak() ? (
                      <button
                        type="button"
                        onClick={() =>
                          speakText(
                            card.original,
                            card.direction === "en-ru" ? "en-US" : "ru-RU"
                          )
                        }
                        className="button-secondary px-3 py-2 text-sm"
                      >
                        🔊
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[15px] text-text-secondary">{card.translation}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span
                        key={`${card.id}-${tag}`}
                        className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-[15px] text-text-secondary lg:items-end">
                  <p>Next review: {formatDateLabel(card.nextReviewDate)}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(card)}
                      disabled={guestMode}
                      title={guestMode ? getTooltipMessage() : undefined}
                      className="button-secondary border-separator text-dangerText disabled:text-text-tertiary"
                    >
                      Delete
                    </button>
                  </div>
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

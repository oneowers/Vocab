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
    <section className="panel rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-quiet">
            Deck
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Your saved cards</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            className="button-secondary min-h-[44px] px-4 py-2 text-sm font-medium"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={onImport}
            disabled={guestMode}
            title={guestMode ? getTooltipMessage() : undefined}
            className="button-secondary min-h-[44px] px-4 py-2 text-sm font-medium"
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
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              selectedTag === "All" ? "bg-ink text-white" : "bg-[#F4F5F7] text-muted"
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSelectTag(tag)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedTag === tag ? "bg-ink text-white" : "bg-[#F4F5F7] text-muted"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search word or translation"
          className="min-h-[44px] w-full max-w-sm rounded-2xl border border-line px-4 py-3 outline-none transition focus:border-ink"
        />
      </div>

      <div className="mt-5 space-y-3">
        {cards.length ? (
          cards.map((card) => (
            <article
              key={card.id}
              className="rounded-[1.75rem] border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-panel"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-ink">{card.original}</h3>
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
                  <p className="mt-2 text-sm text-muted">{card.translation}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span
                        key={`${card.id}-${tag}`}
                        className="rounded-full bg-[#F4F5F7] px-3 py-1 text-xs font-medium text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-sm text-muted lg:items-end">
                  <p>Next review: {formatDateLabel(card.nextReviewDate)}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(card)}
                      disabled={guestMode}
                      title={guestMode ? getTooltipMessage() : undefined}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-dangerText transition hover:bg-dangerBg disabled:cursor-not-allowed disabled:border-line disabled:text-quiet"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-line bg-white px-5 py-10 text-center text-sm text-muted">
            No cards match this filter yet.
          </div>
        )}
      </div>
    </section>
  )
}


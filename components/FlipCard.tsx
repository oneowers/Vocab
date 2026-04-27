"use client"

import { useEffect, useState } from "react"

import { matchesCardStatus } from "@/lib/spaced-repetition"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, CefrLevel, ReviewResult } from "@/lib/types"

const CEFR_STYLES: Record<CefrLevel, { badge: string; dot: string; label: string }> = {
  A1: {
    badge: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
    dot: "bg-emerald-500",
    label: "Beginner"
  },
  A2: {
    badge: "border-lime-200 bg-lime-500/10 text-lime-700",
    dot: "bg-lime-500",
    label: "Elementary"
  },
  B1: {
    badge: "border-sky-200 bg-sky-500/10 text-sky-700",
    dot: "bg-sky-500",
    label: "Intermediate"
  },
  B2: {
    badge: "border-indigo-200 bg-indigo-500/10 text-indigo-700",
    dot: "bg-indigo-500",
    label: "Upper-intermediate"
  },
  C1: {
    badge: "border-fuchsia-200 bg-fuchsia-500/10 text-fuchsia-700",
    dot: "bg-fuchsia-500",
    label: "Advanced"
  },
  C2: {
    badge: "border-rose-200 bg-rose-500/10 text-rose-700",
    dot: "bg-rose-500",
    label: "Mastery"
  }
}

interface FlipCardProps {
  card: CardRecord
  onAnswer: (result: ReviewResult) => void
}

export function FlipCard({ card, onAnswer }: FlipCardProps) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
  }, [card.id])

  return (
    <div className="panel p-6 text-center">
      <div className="flex justify-center">
        <p
          className={`text-[28px] font-bold tracking-[-0.5px] ${
            matchesCardStatus(card, "known") && card.cefrLevel
              ? `${CEFR_STYLES[card.cefrLevel].dot} text-white`
              : "text-text-primary"
          }`}
        >
          {card.original}
        </p>
      </div>
      {card.cefrLevel ? (
        <div className="mt-2 flex justify-center">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${CEFR_STYLES[card.cefrLevel].badge}`}
          >
            {card.cefrLevel} · {CEFR_STYLES[card.cefrLevel].label}
          </span>
        </div>
      ) : null}
      {canSpeak() ? (
        <button
          type="button"
          onClick={() =>
            speakText(card.original, card.direction === "en-ru" ? "en-US" : "ru-RU")
          }
          className="button-secondary mt-4 px-4 py-2 text-sm"
        >
          🔊
        </button>
      ) : null}

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="button-primary mt-8 min-h-[48px] px-5 py-3 text-sm font-medium"
        >
          Show translation
        </button>
      ) : (
        <div className="mt-8">
          <p className="text-[22px] font-bold tracking-[-0.5px] text-text-primary">{card.translation}</p>
          {card.phonetic ? <p className="mt-2 text-[13px] text-text-tertiary">{card.phonetic}</p> : null}
          {card.example ? (
            <p className="mt-4 rounded-[16px] bg-bg-secondary px-4 py-3 text-[15px] leading-6 text-text-secondary">
              {card.example}
            </p>
          ) : null}
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onAnswer("unknown")}
              className="button-secondary border-separator bg-dangerBg text-dangerText"
            >
              ✗ Don&apos;t know
            </button>
            <button
              type="button"
              onClick={() => onAnswer("known")}
              className="button-secondary border-separator bg-successBg text-successText"
            >
              ✓ I know it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

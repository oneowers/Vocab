"use client"

import { useEffect, useState } from "react"

import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, ReviewResult } from "@/lib/types"

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
    <div className="panel rounded-[2rem] p-6 text-center">
      <div className="flex justify-center">
        <p
          className="text-5xl text-ink"
          style={{ fontFamily: "\"DM Serif Display\", Georgia, serif" }}
        >
          {card.original}
        </p>
      </div>
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
          <p className="text-2xl font-semibold text-ink">{card.translation}</p>
          {card.phonetic ? <p className="mt-2 text-sm text-quiet">{card.phonetic}</p> : null}
          {card.example ? (
            <p className="mt-4 rounded-[1.5rem] bg-[#F4F5F7] px-4 py-3 text-sm leading-6 text-muted">
              {card.example}
            </p>
          ) : null}
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onAnswer("unknown")}
              className="min-h-[48px] rounded-full bg-dangerBg px-5 py-3 text-sm font-medium text-dangerText"
            >
              ✗ Don&apos;t know
            </button>
            <button
              type="button"
              onClick={() => onAnswer("known")}
              className="min-h-[48px] rounded-full bg-successBg px-5 py-3 text-sm font-medium text-successText"
            >
              ✓ I know it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

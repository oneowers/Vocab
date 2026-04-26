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
    <div className="panel p-6 text-center">
      <div className="flex justify-center">
        <p className="text-[28px] font-bold tracking-[-0.5px] text-text-primary">{card.original}</p>
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

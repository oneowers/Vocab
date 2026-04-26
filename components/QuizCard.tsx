"use client"

import { useEffect, useState } from "react"

import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, ReviewResult } from "@/lib/types"

interface QuizCardProps {
  card: CardRecord
  options: string[]
  onResolved: (result: ReviewResult) => void
}

export function QuizCard({ card, options, onResolved }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setSelected(null)
  }, [card.id])

  function handleSelect(option: string) {
    if (selected) {
      return
    }

    setSelected(option)

    const nextResult: ReviewResult = option === card.translation ? "known" : "unknown"
    window.setTimeout(() => onResolved(nextResult), 1200)
  }

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[15px] text-text-secondary">Choose the right translation</p>
          <p className="mt-3 text-[28px] font-bold tracking-[-0.5px] text-text-primary">{card.original}</p>
        </div>
        {canSpeak() ? (
          <button
            type="button"
            onClick={() =>
              speakText(card.original, card.direction === "en-ru" ? "en-US" : "ru-RU")
            }
            className="button-secondary px-3 py-2 text-sm"
          >
            🔊
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const isCorrect = option === card.translation
          const isSelected = selected === option
          const className = !selected
            ? "border-separator bg-bg-primary text-text-primary hover:border-accent"
            : isCorrect
              ? "border-separator bg-successBg text-successText"
              : isSelected
                ? "border-separator bg-dangerBg text-dangerText"
                : "border-separator bg-bg-secondary text-text-tertiary"

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`min-h-[84px] rounded-[1.5rem] border px-4 py-4 text-left text-sm font-medium transition ${className}`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

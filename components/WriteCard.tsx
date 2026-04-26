"use client"

import { useEffect, useState } from "react"

import { levenshtein } from "@/lib/levenshtein"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, ReviewResult } from "@/lib/types"

interface WriteCardProps {
  card: CardRecord
  onResolved: (result: ReviewResult) => void
}

export function WriteCard({ card, onResolved }: WriteCardProps) {
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<ReviewResult | null>(null)

  useEffect(() => {
    setAnswer("")
    setResult(null)
  }, [card.id])

  function handleSubmit() {
    if (result) {
      return
    }

    const normalizedAnswer = answer.trim().toLowerCase()
    const normalizedTranslation = card.translation.trim().toLowerCase()
    const isCorrect =
      normalizedAnswer === normalizedTranslation ||
      levenshtein(normalizedAnswer, normalizedTranslation) <= 2
    const nextResult: ReviewResult = isCorrect ? "known" : "unknown"
    setResult(nextResult)

    window.setTimeout(
      () => {
        onResolved(nextResult)
      },
      isCorrect ? 1500 : 2000
    )
  }

  return (
    <div className="panel rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Type the translation</p>
          <p
            className="mt-3 text-4xl text-ink"
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
            className="button-secondary px-3 py-2 text-sm"
          >
            🔊
          </button>
        ) : null}
      </div>

      <input
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSubmit()
          }
        }}
        placeholder="Type the translation..."
        className="mt-6 min-h-[52px] w-full rounded-2xl border border-line px-4 py-3 outline-none transition focus:border-ink"
      />
      <button
        type="button"
        onClick={handleSubmit}
        className="button-primary mt-4 min-h-[48px] px-5 py-3 text-sm font-medium"
      >
        Check answer
      </button>

      {result ? (
        <div
          className={`mt-5 rounded-[1.5rem] px-4 py-4 text-sm ${
            result === "known"
              ? "bg-successBg text-successText"
              : "bg-dangerBg text-dangerText"
          }`}
        >
          {result === "known" ? "Correct." : "Not quite."} Right answer:{" "}
          <span className="font-semibold">{card.translation}</span>
        </div>
      ) : null}
    </div>
  )
}

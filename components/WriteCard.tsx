"use client"

import { useEffect, useState } from "react"

import { levenshtein } from "@/lib/levenshtein"
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

interface WriteCardProps {
  card: CardRecord
  onResolved: (result: ReviewResult) => void
}

export function WriteCard({ card, onResolved }: WriteCardProps) {
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<ReviewResult | null>(null)
  const promptText = card.direction === "en-ru" ? card.translation : card.original
  const expectedAnswer = card.direction === "en-ru" ? card.original : card.translation
  const promptLanguage = card.direction === "en-ru" ? "ru-RU" : "ru-RU"

  useEffect(() => {
    setAnswer("")
    setResult(null)
  }, [card.id])

  function handleSubmit() {
    if (result) {
      return
    }

    const normalizedAnswer = answer.trim().toLowerCase()
    const normalizedTranslation = expectedAnswer.trim().toLowerCase()
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
    <div className="panel p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[15px] text-text-secondary">Translate into English</p>
          <p className="mt-3 text-[28px] font-bold tracking-[-0.5px] text-text-primary">{promptText}</p>
        </div>
        {canSpeak() ? (
          <button
            type="button"
            onClick={() => speakText(promptText, promptLanguage)}
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
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        placeholder="Type the English word..."
        className="input-field mt-6"
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
          className={`mt-5 rounded-[16px] px-4 py-4 text-[15px] ${result === "known"
              ? "bg-successBg text-successText"
              : "bg-dangerBg text-dangerText"
            }`}
        >
          {result === "known" ? "Correct." : "Not quite."} Right answer:{" "}
          <span
            className={`font-semibold ${result === "known" && card.cefrLevel
                ? CEFR_STYLES[card.cefrLevel].dot + " rounded px-1 py-0.5 text-white"
                : ""
              }`}
          >
            {expectedAnswer}
          </span>
          {card.cefrLevel ? (
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CEFR_STYLES[card.cefrLevel].badge}`}
              >
                {card.cefrLevel}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

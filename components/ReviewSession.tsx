"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { FlipCard } from "@/components/FlipCard"
import { QuizCard } from "@/components/QuizCard"
import { WriteCard } from "@/components/WriteCard"
import { useToast } from "@/components/Toast"
import { getTodayDateKey } from "@/lib/date"
import {
  getGuestCards,
  getGuestReviewLogs,
  isGuestSessionActive,
  recordGuestReview
} from "@/lib/guest"
import { matchesCardStatus, sortDueCards } from "@/lib/spaced-repetition"
import type { CardRecord, CardsResponse, CardStatusFilter, ReviewResult } from "@/lib/types"

type ReviewMode = "flip" | "write" | "quiz"

function shuffleOptions(options: string[]) {
  const nextOptions = [...options]

  for (let index = nextOptions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextOptions[index], nextOptions[swapIndex]] = [
      nextOptions[swapIndex],
      nextOptions[index]
    ]
  }

  return nextOptions
}

function getGuestStreak() {
  const uniqueDays = Array.from(
    new Set(getGuestReviewLogs().map((log) => log.createdAt.slice(0, 10)))
  ).sort()

  if (!uniqueDays.length) {
    return 0
  }

  let current = 1

  for (let index = uniqueDays.length - 1; index > 0; index -= 1) {
    const currentDate = new Date(`${uniqueDays[index]}T00:00:00.000Z`)
    const previousDate = new Date(`${uniqueDays[index - 1]}T00:00:00.000Z`)
    const diff = (currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000)

    if (diff === 1) {
      current += 1
    } else {
      break
    }
  }

  return current
}

export function ReviewSession() {
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allCards, setAllCards] = useState<CardRecord[]>([])
  const [dueCards, setDueCards] = useState<CardRecord[]>([])
  const [mode, setMode] = useState<ReviewMode>("flip")
  const [selectedStatus, setSelectedStatus] = useState<CardStatusFilter>("All")
  const [started, setStarted] = useState(false)
  const [roundCards, setRoundCards] = useState<CardRecord[]>([])
  const [roundResults, setRoundResults] = useState<Record<string, ReviewResult>>({})
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState(0)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadSession() {
      const guestActive = isGuestSessionActive()
      setGuestMode(guestActive)

      if (guestActive) {
        const cards = sortDueCards(getGuestCards())
        setAllCards(cards)
        setDueCards(cards.filter((card) => card.nextReviewDate <= getTodayDateKey()))
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/cards", {
          cache: "no-store"
        })

        if (!response.ok) {
          throw new Error("Could not load cards.")
        }

        const payload = (await response.json()) as CardsResponse
        const sortedCards = sortDueCards(payload.cards)
        setAllCards(sortedCards)
        setDueCards(sortedCards.filter((card) => card.nextReviewDate <= getTodayDateKey()))
        setStreak(payload.summary.streak)
      } catch {
        showToast("Could not load review cards.", "error")
      } finally {
        setLoading(false)
      }
    }

    void loadSession()
  }, [showToast])

  const availableCards = dueCards.filter((card) => matchesCardStatus(card, selectedStatus))
  const allAvailableCards = allCards.filter((card) => matchesCardStatus(card, selectedStatus))
  const currentCard = roundCards[index]

  async function handleAnswer(result: ReviewResult) {
    if (!currentCard) {
      return
    }

    if (result === "known") {
      setCorrect((value) => value + 1)
    } else {
      setWrong((value) => value + 1)
    }
    setRoundResults((current) => ({
      ...current,
      [currentCard.id]: result
    }))

    try {
      if (guestMode) {
        const nextCards = recordGuestReview(currentCard.id, result)
        const nextDueCards = sortDueCards(nextCards).filter(
          (card) => card.nextReviewDate <= getTodayDateKey()
        )
        setAllCards(sortDueCards(nextCards))
        setDueCards(nextDueCards)
        setStreak(getGuestStreak())
        setIndex((currentIndex) => currentIndex + 1)
      } else {
        const response = await fetch("/api/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cardId: currentCard.id,
            result
          })
        })

        if (!response.ok) {
          throw new Error("Review failed.")
        }

        const payload = (await response.json()) as {
          card: CardRecord
          streak: number
        }

        const nextCards = allCards.map((card) =>
          card.id === payload.card.id ? payload.card : card
        )
        const nextDueCards = sortDueCards(nextCards).filter(
          (card) => card.nextReviewDate <= getTodayDateKey()
        )
        setAllCards(sortDueCards(nextCards))
        setDueCards(nextDueCards)
        setStreak(payload.streak)
        setIndex((currentIndex) => currentIndex + 1)
      }
    } catch {
      showToast("Could not save this review result.", "error")
    }
  }

  function startRound(cards: CardRecord[]) {
    setRoundCards(cards)
    setRoundResults({})
    setIndex(0)
    setCorrect(0)
    setWrong(0)
    setStarted(true)
  }

  function buildQuizOptions(card: CardRecord) {
    const pool = allCards
      .filter((item) => item.id !== card.id)
      .map((item) => item.translation)
      .filter((value, optionIndex, values) => values.indexOf(value) === optionIndex)
    const distractors = shuffleOptions(pool).slice(0, 3)
    return shuffleOptions([card.translation, ...distractors])
  }

  if (loading) {
    return <div className="skeleton h-[32rem] rounded-[2rem]" />
  }

  if (!started) {
    return (
      <section className="panel mx-auto max-w-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-quiet">
              Review
            </p>
            <h1 className="mt-2 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
              Start today&apos;s session
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-text-secondary">
              Choose a mode, filter by status if you want, and work through every due card.
            </p>
          </div>
          <Link
            href="/"
            prefetch
            className="button-secondary inline-flex px-4 py-2 text-sm font-medium"
          >
            Exit
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { value: "flip", label: "Flip" },
            { value: "write", label: "Write" },
            { value: "quiz", label: "Quiz" }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value as ReviewMode)}
              className={`rounded-[1.75rem] border px-5 py-5 text-left ${
                mode === item.value
                  ? "border-accent bg-accent text-accentForeground"
                  : "border-separator bg-bg-primary text-text-primary"
              }`}
            >
              <p className="text-[15px] font-semibold">{item.label}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["All", "known", "unknown"] as CardStatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
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

        {mode === "quiz" && allCards.length < 4 ? (
          <div className="mt-6 rounded-[1.5rem] bg-dangerBg px-4 py-4 text-sm text-dangerText">
            Add at least 4 cards to unlock quiz mode.
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-separator bg-bg-secondary px-5 py-5">
            <p className="text-[15px] text-text-secondary">
              Cards due now: <span className="font-semibold text-text-primary">{availableCards.length}</span>
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-separator bg-bg-secondary px-5 py-5">
            <p className="text-[15px] text-text-secondary">
              All matching cards: <span className="font-semibold text-text-primary">{allAvailableCards.length}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              if (mode === "quiz" && availableCards.length < 4) {
                return
              }
              startRound(availableCards)
            }}
            disabled={!availableCards.length || (mode === "quiz" && availableCards.length < 4)}
            className="button-primary min-h-[48px] flex-1 px-5 py-3 text-sm font-medium"
          >
            Start due words
          </button>
          <button
            type="button"
            onClick={() => {
              if (mode === "quiz" && allAvailableCards.length < 4) {
                return
              }
              startRound(allAvailableCards)
            }}
            disabled={!allAvailableCards.length || (mode === "quiz" && allAvailableCards.length < 4)}
            className="button-secondary min-h-[48px] flex-1 px-5 py-3 text-sm font-medium"
          >
            Repeat all words
          </button>
        </div>
      </section>
    )
  }

  if (!currentCard) {
    const total = correct + wrong
    const accuracy = total ? Math.round((correct / total) * 100) : 0
    const unknownCards = roundCards
      .filter((card) => roundResults[card.id] === "unknown")
      .map((card) => allCards.find((item) => item.id === card.id) ?? card)

    return (
      <section className="panel mx-auto max-w-3xl p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-quiet">
          Session complete
        </p>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.5px] text-text-primary">Session complete!</h1>
        <p className="mt-4 text-[15px] text-text-secondary">
          Correct: {correct} | Wrong: {wrong} | Accuracy: {accuracy}%
        </p>
        <p className="mt-2 text-[15px] text-text-secondary">Streak: {streak} days</p>
        {unknownCards.length ? (
          <div className="mt-6 space-y-3">
            <p className="text-[15px] text-text-secondary">
              Unknown words left:{" "}
              <span className="font-semibold text-text-primary">{unknownCards.length}</span>
            </p>
            <button
              type="button"
              onClick={() => startRound(unknownCards)}
              className="button-primary inline-flex min-h-[48px] px-5 py-3 text-sm font-medium"
            >
              Play unknown words again
            </button>
          </div>
        ) : (
          <Link
            href="/"
            prefetch
            className="button-primary mt-8 inline-flex min-h-[48px] px-5 py-3 text-sm font-medium"
          >
            Back to deck
          </Link>
        )}
      </section>
    )
  }

  const progress = Math.round(((index + 1) / roundCards.length) * 100)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              Card {Math.min(index + 1, roundCards.length)} of {roundCards.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </p>
          </div>
          <Link
            href="/"
            prefetch
            className="button-secondary inline-flex px-4 py-2 text-sm font-medium"
          >
            Exit
          </Link>
        </div>
        <div className="mt-4 h-3 rounded-full bg-bg-secondary">
          <div
            className="h-3 rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {mode === "flip" ? (
        <FlipCard card={currentCard} onAnswer={(result) => void handleAnswer(result)} />
      ) : null}
      {mode === "write" ? (
        <WriteCard card={currentCard} onResolved={(result) => void handleAnswer(result)} />
      ) : null}
      {mode === "quiz" ? (
        <QuizCard
          card={currentCard}
          options={buildQuizOptions(currentCard)}
          onResolved={(result) => void handleAnswer(result)}
        />
      ) : null}
    </div>
  )
}

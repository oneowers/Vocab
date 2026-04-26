"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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
import { sortDueCards } from "@/lib/spaced-repetition"
import type { CardRecord, CardsResponse, ReviewResult } from "@/lib/types"

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
  const [selectedTag, setSelectedTag] = useState("All")
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState(0)
  const router = useRouter()
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

  const availableTags = Array.from(new Set(allCards.flatMap((card) => card.tags)))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))

  const sessionCards = dueCards.filter(
    (card) => selectedTag === "All" || card.tags.includes(selectedTag)
  )

  const currentCard = sessionCards[index]

  async function handleAnswer(result: ReviewResult) {
    if (!currentCard) {
      return
    }

    if (result === "known") {
      setCorrect((value) => value + 1)
    } else {
      setWrong((value) => value + 1)
    }

    try {
      if (guestMode) {
        const nextCards = recordGuestReview(currentCard.id, result)
        const nextDueCards = sortDueCards(nextCards).filter(
          (card) => card.nextReviewDate <= getTodayDateKey()
        )
        setAllCards(sortDueCards(nextCards))
        setDueCards(nextDueCards)
        setStreak(getGuestStreak())
        setIndex((currentIndex) =>
          currentIndex >= nextDueCards.length ? nextDueCards.length : currentIndex
        )
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
        setIndex((currentIndex) =>
          currentIndex >= nextDueCards.length ? nextDueCards.length : currentIndex
        )
      }
    } catch {
      showToast("Could not save this review result.", "error")
    }
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
      <section className="panel mx-auto max-w-3xl rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-quiet">
              Review
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Start today&apos;s session</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Choose a mode, filter by tag if you want, and work through every due card.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="button-secondary px-4 py-2 text-sm font-medium"
          >
            Exit
          </button>
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
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink"
              }`}
            >
              <p className="text-sm font-medium">{item.label}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTag("All")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              selectedTag === "All" ? "bg-ink text-white" : "bg-[#F4F5F7] text-muted"
            }`}
          >
            All
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedTag === tag ? "bg-ink text-white" : "bg-[#F4F5F7] text-muted"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {mode === "quiz" && allCards.length < 4 ? (
          <div className="mt-6 rounded-[1.5rem] bg-dangerBg px-4 py-4 text-sm text-dangerText">
            Add at least 4 cards to unlock quiz mode.
          </div>
        ) : null}

        <div className="mt-6 rounded-[1.75rem] border border-line bg-[#FCFCFD] px-5 py-5">
          <p className="text-sm text-muted">
            Cards due now: <span className="font-semibold text-ink">{sessionCards.length}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (mode === "quiz" && allCards.length < 4) {
              return
            }
            setIndex(0)
            setCorrect(0)
            setWrong(0)
            setStarted(true)
          }}
          disabled={!sessionCards.length || (mode === "quiz" && allCards.length < 4)}
          className="button-primary mt-6 min-h-[48px] px-5 py-3 text-sm font-medium"
        >
          Start session
        </button>
      </section>
    )
  }

  if (!currentCard) {
    const total = correct + wrong
    const accuracy = total ? Math.round((correct / total) * 100) : 0

    return (
      <section className="panel mx-auto max-w-3xl rounded-[2rem] p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-quiet">
          Session complete
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink">Session complete! 🎉</h1>
        <p className="mt-4 text-sm text-muted">
          Correct: {correct} | Wrong: {wrong} | Accuracy: {accuracy}%
        </p>
        <p className="mt-2 text-sm text-muted">🔥 Streak: {streak} days!</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="button-primary mt-8 min-h-[48px] px-5 py-3 text-sm font-medium"
        >
          Back to deck
        </button>
      </section>
    )
  }

  const progress = Math.round(((index + 1) / sessionCards.length) * 100)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="panel rounded-[2rem] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              Card {Math.min(index + 1, sessionCards.length)} of {sessionCards.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="button-secondary px-4 py-2 text-sm font-medium"
          >
            Exit
          </button>
        </div>
        <div className="mt-4 h-3 rounded-full bg-[#F4F5F7]">
          <div
            className="h-3 rounded-full bg-ink transition-all"
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

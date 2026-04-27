"use client"

import Link from "next/link"
import { Outfit } from "next/font/google"
import { useEffect, useState } from "react"

import { FlipCard } from "@/components/FlipCard"
import { QuizCard, type QuizMatchItem } from "@/components/QuizCard"
import { ReviewSessionOverview } from "@/components/ReviewSessionOverview"
import { ReviewStageStepper } from "@/components/ReviewStageStepper"
import { WriteCard } from "@/components/WriteCard"
import styles from "@/components/review-session.module.css"
import { useToast } from "@/components/Toast"
import { getTodayDateKey } from "@/lib/date"
import {
  DEFAULT_GUEST_REVIEW_LIVES,
  commitGuestReviewSession,
  getGuestCards,
  getGuestReviewLogs,
  isGuestSessionActive
} from "@/lib/guest"
import { matchesCardStatus, sortDueCards } from "@/lib/spaced-repetition"
import type { CardRecord, CardsResponse, CardStatusFilter, ReviewResult } from "@/lib/types"

type ReviewStage = "flip" | "quiz" | "write"
type ReviewSessionStatus = "idle" | "active" | "saving" | "save-error" | "success"
type ReviewFlow = "linked" | "single"

interface QuizBatch {
  id: string
  leftItems: QuizMatchItem[]
  rightItems: QuizMatchItem[]
}

const QUIZ_BATCH_SIZE = 4
const REVIEW_STEPS: Array<{ value: ReviewStage; label: string }> = [
  { value: "flip", label: "Flip" },
  { value: "quiz", label: "Quiz" },
  { value: "write", label: "Write" }
]

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"]
})

function shuffleItems<T>(items: T[]) {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]]
  }

  return nextItems
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

function getRussianPrompt(card: CardRecord) {
  return card.direction === "en-ru" ? card.translation : card.original
}

function getEnglishAnswer(card: CardRecord) {
  return card.direction === "en-ru" ? card.original : card.translation
}

function buildQuizBatches(cards: CardRecord[]) {
  if (!cards.length) {
    return []
  }

  const batches: QuizBatch[] = []

  for (let batchIndex = 0; batchIndex < cards.length; batchIndex += QUIZ_BATCH_SIZE) {
    const batchCards = cards.slice(batchIndex, batchIndex + QUIZ_BATCH_SIZE)
    const filledCards = [...batchCards]
    let fillerIndex = 0

    while (filledCards.length < QUIZ_BATCH_SIZE) {
      filledCards.push(cards[fillerIndex % cards.length])
      fillerIndex += 1
    }

    batches.push({
      id: `quiz-batch-${batchIndex / QUIZ_BATCH_SIZE}`,
      leftItems: shuffleItems(
        filledCards.map((card, index) => ({
          id: `left-${batchIndex}-${index}-${card.id}`,
          sourceCardId: card.id,
          text: getRussianPrompt(card)
        }))
      ),
      rightItems: shuffleItems(
        filledCards.map((card, index) => ({
          id: `right-${batchIndex}-${index}-${card.id}`,
          sourceCardId: card.id,
          text: getEnglishAnswer(card)
        }))
      )
    })
  }

  return batches
}

function getStageLabel(stage: ReviewStage) {
  return REVIEW_STEPS.find((item) => item.value === stage)?.label ?? "Stage"
}

export function ReviewSession() {
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allCards, setAllCards] = useState<CardRecord[]>([])
  const [dueCards, setDueCards] = useState<CardRecord[]>([])
  const [streak, setStreak] = useState(0)
  const [reviewLives, setReviewLives] = useState(DEFAULT_GUEST_REVIEW_LIVES)
  const [selectedStatus, setSelectedStatus] = useState<CardStatusFilter>("All")
  const [practiceStage, setPracticeStage] = useState<ReviewStage>("flip")
  const [sessionStatus, setSessionStatus] = useState<ReviewSessionStatus>("idle")
  const [sessionFlow, setSessionFlow] = useState<ReviewFlow>("linked")
  const [sessionCards, setSessionCards] = useState<CardRecord[]>([])
  const [quizBatches, setQuizBatches] = useState<QuizBatch[]>([])
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [completedStages, setCompletedStages] = useState<ReviewStage[]>([])
  const [livesRemaining, setLivesRemaining] = useState(DEFAULT_GUEST_REVIEW_LIVES)
  const [stageAttempt, setStageAttempt] = useState(0)
  const [flipIndex, setFlipIndex] = useState(0)
  const [quizBatchIndex, setQuizBatchIndex] = useState(0)
  const [quizSolvedPairs, setQuizSolvedPairs] = useState(0)
  const [writeIndex, setWriteIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadSession() {
      const guestActive = isGuestSessionActive()
      setGuestMode(guestActive)

      if (guestActive) {
        const cards = sortDueCards(getGuestCards())
        setAllCards(cards)
        setDueCards(cards.filter((card) => card.nextReviewDate <= getTodayDateKey()))
        setStreak(getGuestStreak())
        setReviewLives(DEFAULT_GUEST_REVIEW_LIVES)
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
        setReviewLives(payload.summary.reviewLives)
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
  const activeStage = REVIEW_STEPS[activeStageIndex]?.value ?? "flip"
  const currentCard =
    activeStage === "flip"
      ? sessionCards[flipIndex]
      : activeStage === "write"
        ? sessionCards[writeIndex]
        : null
  const currentQuizBatch = quizBatches[quizBatchIndex]

  function refreshCardCollections(nextCards: CardRecord[]) {
    const sortedCards = sortDueCards(nextCards)
    setAllCards(sortedCards)
    setDueCards(sortedCards.filter((card) => card.nextReviewDate <= getTodayDateKey()))
  }

  function startSession(cards: CardRecord[], startStage: ReviewStage = "flip", flow: ReviewFlow = "linked") {
    const startIndex = REVIEW_STEPS.findIndex((item) => item.value === startStage)
    setSessionCards(cards)
    setQuizBatches(buildQuizBatches(cards))
    setActiveStageIndex(startIndex >= 0 ? startIndex : 0)
    setCompletedStages([])
    setLivesRemaining(reviewLives)
    setFlipIndex(0)
    setQuizBatchIndex(0)
    setQuizSolvedPairs(0)
    setWriteIndex(0)
    setMistakes(0)
    setStageAttempt(0)
    setSessionFlow(flow)
    setSessionStatus("active")
  }

  function restartActiveStage() {
    const stage = REVIEW_STEPS[activeStageIndex].value

    setLivesRemaining(reviewLives)
    setStageAttempt((current) => current + 1)
    setQuizSolvedPairs(0)

    if (stage === "flip") {
      setFlipIndex(0)
    }

    if (stage === "quiz") {
      setQuizBatchIndex(0)
    }

    if (stage === "write") {
      setWriteIndex(0)
    }

    showToast(`${getStageLabel(stage)} restarted. Lives refilled.`, "error")
  }

  function spendLife() {
    const nextLives = livesRemaining - 1
    setMistakes((current) => current + 1)

    if (nextLives > 0) {
      setLivesRemaining(nextLives)
      return false
    }

    restartActiveStage()
    return true
  }

  function advanceToNextStage(stage: ReviewStage) {
    setCompletedStages((current) =>
      current.includes(stage) ? current : [...current, stage]
    )
    setLivesRemaining(reviewLives)
    setStageAttempt((current) => current + 1)
    setQuizSolvedPairs(0)

    if (stage === "flip") {
      setActiveStageIndex(1)
      setQuizBatchIndex(0)
      return
    }

    if (stage === "quiz") {
      setActiveStageIndex(2)
      setWriteIndex(0)
    }
  }

  async function commitSession() {
    setSessionStatus("saving")

    try {
      if (guestMode) {
        const nextCards = commitGuestReviewSession(sessionCards.map((card) => card.id))
        refreshCardCollections(nextCards)
        setStreak(getGuestStreak())
      } else {
        const response = await fetch("/api/review/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reviews: Array.from(new Set(sessionCards.map((card) => card.id))).map((cardId) => ({
              cardId,
              result: "known"
            }))
          })
        })

        if (!response.ok) {
          throw new Error("Session save failed.")
        }

        const payload = (await response.json()) as {
          cards: CardRecord[]
          streak: number
        }
        const updatedCards = new Map(payload.cards.map((card) => [card.id, card]))
        const nextCards = allCards.map((card) => updatedCards.get(card.id) ?? card)
        refreshCardCollections(nextCards)
        setStreak(payload.streak)
      }

      setCompletedStages((current) =>
        current.includes("write") ? current : [...current, "write"]
      )
      setSessionStatus("success")
    } catch {
      setSessionStatus("save-error")
      showToast("Could not save this linked review session.", "error")
    }
  }

  function handleFlipResolved(result: ReviewResult) {
    if (result === "unknown" && spendLife()) {
      return
    }

    if (flipIndex + 1 >= sessionCards.length) {
      if (sessionFlow === "single") {
        void commitSession()
        return
      }
      advanceToNextStage("flip")
      return
    }

    setFlipIndex((current) => current + 1)
  }

  function handleQuizLifeLost() {
    spendLife()
  }

  function handleQuizBatchCompleted() {
    if (quizBatchIndex + 1 >= quizBatches.length) {
      if (sessionFlow === "single") {
        void commitSession()
        return
      }
      advanceToNextStage("quiz")
      return
    }

    setQuizBatchIndex((current) => current + 1)
    setQuizSolvedPairs(0)
  }

  function handleWriteResolved(result: ReviewResult) {
    if (result === "unknown" && spendLife()) {
      return
    }

    if (writeIndex + 1 >= sessionCards.length) {
      void commitSession()
      return
    }

    setWriteIndex((current) => current + 1)
  }

  function getActiveStageProgress() {
    if (!sessionCards.length) {
      return 0
    }

    if (activeStage === "flip") {
      return Math.round(((flipIndex + 1) / sessionCards.length) * 100)
    }

    if (activeStage === "write") {
      return Math.round(((writeIndex + 1) / sessionCards.length) * 100)
    }

    const totalPairs = Math.max(quizBatches.length * QUIZ_BATCH_SIZE, 1)
    const currentPair = Math.min(
      quizBatchIndex * QUIZ_BATCH_SIZE + quizSolvedPairs + 1,
      totalPairs
    )

    return Math.round((currentPair / totalPairs) * 100)
  }

  function getStageCounterLabel() {
    if (activeStage === "flip") {
      return `Card ${Math.min(flipIndex + 1, sessionCards.length)} of ${sessionCards.length}`
    }

    if (activeStage === "write") {
      return `Card ${Math.min(writeIndex + 1, sessionCards.length)} of ${sessionCards.length}`
    }

    const totalPairs = quizBatches.length * QUIZ_BATCH_SIZE
    const currentPair = Math.min(
      quizBatchIndex * QUIZ_BATCH_SIZE + quizSolvedPairs + 1,
      totalPairs
    )

    return `Pair ${currentPair} of ${totalPairs}`
  }

  if (loading) {
    return <div className="skeleton h-[32rem] rounded-[2rem]" />
  }

  if (sessionStatus === "idle") {
    return (
      <div className={outfit.className}>
        <ReviewSessionOverview
          currentStage="flip"
          completedStages={[]}
          cardsDue={availableCards.length}
          totalCards={allAvailableCards.length}
          selectedStatus={selectedStatus}
          practiceStage={practiceStage}
          onSelectStatus={setSelectedStatus}
          onSelectPracticeStage={setPracticeStage}
          onStartDue={() => startSession(availableCards, "flip", "linked")}
          onStartPractice={() => startSession(allAvailableCards, practiceStage, "single")}
        />
      </div>
    )
  }

  if (sessionStatus === "saving" || sessionStatus === "save-error") {
    return (
      <section className={`panel mx-auto max-w-5xl p-6 text-center ${outfit.className}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-quiet">
          {sessionStatus === "saving" ? "Saving" : "Save error"}
        </p>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
          {sessionStatus === "saving"
            ? "Saving your linked session"
            : "We couldn&apos;t save this session"}
        </h1>
        <div className="mt-6">
          <ReviewStageStepper
            items={REVIEW_STEPS}
            currentStage="write"
            completedValues={completedStages}
            variant="compact"
          />
        </div>
        <p className="mt-6 text-[15px] text-text-secondary">
          {sessionStatus === "saving"
            ? "Please wait while we save your completed stages."
            : "Your review path is finished, but the final save needs another try."}
        </p>
        {sessionStatus === "save-error" ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => void commitSession()}
              className="button-primary min-h-[48px] px-5 py-3 text-sm font-medium"
            >
              Retry save
            </button>
            <Link
              href="/"
              prefetch
              className="button-secondary inline-flex min-h-[48px] items-center justify-center px-5 py-3 text-sm font-medium"
            >
              Back to deck
            </Link>
          </div>
        ) : null}
      </section>
    )
  }

  if (sessionStatus === "success") {
    return (
      <section className={`panel mx-auto max-w-5xl p-6 text-center ${outfit.className}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-quiet">
          Session complete
        </p>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
          You crushed it
        </h1>
        <div className="mt-6">
          <ReviewStageStepper
            items={REVIEW_STEPS}
            currentStage="write"
            completedValues={REVIEW_STEPS.map((item) => item.value)}
            variant="compact"
          />
        </div>
        <p className="mt-6 text-[15px] text-text-secondary">
          {sessionCards.length} cards completed across all 3 stages.
        </p>
        <p className="mt-2 text-[15px] text-text-secondary">
          Mistakes spent: {mistakes} | Streak: {streak} days
        </p>
        <Link
          href="/"
          prefetch
          className="button-primary mt-8 inline-flex min-h-[48px] px-5 py-3 text-sm font-medium"
        >
          Back to deck
        </Link>
      </section>
    )
  }

  if (!currentCard && activeStage !== "quiz") {
    return null
  }

  const progress = getActiveStageProgress()

  return (
    <div className={`mx-auto w-full max-w-5xl space-y-5 ${outfit.className}`}>
        <div className={`panel p-5 ${styles.activeHeader}`}>
        <div className={styles.activeHeaderTop}>
          <div className="min-w-0 flex-1">
            <div className={styles.sessionMeta}>
              <p className={styles.sessionCounter}>{getStageCounterLabel()}</p>
              <p className={styles.sessionStage}>Stage: {getStageLabel(activeStage)}</p>
            </div>
            <div className={styles.stepperBlock}>
              <ReviewStageStepper
                items={REVIEW_STEPS}
                currentStage={activeStage}
                completedValues={completedStages}
                variant="compact"
              />
            </div>
          </div>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {activeStage === "flip" ? (
        <FlipCard
          key={`flip-${stageAttempt}-${currentCard?.id ?? "none"}`}
          card={currentCard as CardRecord}
          onAnswer={handleFlipResolved}
        />
      ) : null}

      {activeStage === "quiz" && currentQuizBatch ? (
        <QuizCard
          key={`${currentQuizBatch.id}-${stageAttempt}`}
          leftItems={currentQuizBatch.leftItems}
          rightItems={currentQuizBatch.rightItems}
          batchIndex={quizBatchIndex}
          totalBatches={quizBatches.length}
          onLifeLost={handleQuizLifeLost}
          onBatchCompleted={handleQuizBatchCompleted}
          onProgressChange={setQuizSolvedPairs}
        />
      ) : null}

      {activeStage === "write" ? (
        <WriteCard
          key={`write-${stageAttempt}-${currentCard?.id ?? "none"}`}
          card={currentCard as CardRecord}
          onResolved={handleWriteResolved}
        />
      ) : null}
    </div>
  )
}

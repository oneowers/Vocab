"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Zap, Trophy, ArrowUpRight, Plus } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { FlipCard } from "@/components/FlipCard"
import { DailyWordsModal } from "@/components/DailyWordsModal"
import { PracticeWritingChallenge } from "@/components/PracticeWritingChallenge"
import { QuizCard, type QuizMatchItem } from "@/components/QuizCard"
import { ReviewSessionOverview } from "@/components/ReviewSessionOverview"
import { WriteCard } from "@/components/WriteCard"
import { PracticeBackground } from "@/components/PracticeBackground"
import styles from "@/components/review-session.module.css"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { getTodayDateKey } from "@/lib/date"
import {
  DEFAULT_GUEST_REVIEW_LIVES,
  commitGuestReviewSession,
  getGuestCards,
  getGuestReviewLogs,
  isGuestSessionActive
} from "@/lib/guest"
import { getReviewOutcome, matchesCardStatus, sortDueCards } from "@/lib/spaced-repetition"
import type { CardRecord, CardsResponse, CardStatusFilter, DailyCatalogStatus, DailyClaimResponse, ReviewResult } from "@/lib/types"
import { trackEvent } from "@/lib/analytics"

type ReviewStage = "flip" | "quiz" | "write" | "challenge"
type ReviewSessionStatus = "idle" | "active" | "saving" | "save-error" | "success"
type ReviewFlow = "linked" | "single"

interface QuizBatch {
  id: string
  leftItems: QuizMatchItem[]
  rightItems: QuizMatchItem[]
  targetCount: number
}

const QUIZ_BATCH_SIZE = 4
const PRACTICE_SESSION_LIMIT = 20
const REVIEW_STEPS: Array<{ value: ReviewStage; label: string }> = [
  { value: "flip", label: "Flip" },
  { value: "quiz", label: "Quiz" },
  { value: "write", label: "Write" },
  { value: "challenge", label: "Challenge" }
]

interface SavedPracticeSession {
  id: string
  cardIds: string[]
  completedStages: ReviewStage[]
  activeStage: ReviewStage
  selectedStatus: CardStatusFilter
  flow: ReviewFlow
  state: {
    mistakes?: number
    stageAttempt?: number
    results?: Record<string, ReviewResult>
  }
  updatedAt: string
}

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

    batches.push({
      id: `quiz-batch-${batchIndex / QUIZ_BATCH_SIZE}`,
      targetCount: batchCards.length,
      leftItems: shuffleItems(
        batchCards.map((card, index) => ({
          id: `left-${batchIndex}-${index}-${card.id}`,
          sourceCardId: card.id,
          text: getRussianPrompt(card)
        }))
      ),
      rightItems: shuffleItems(
        batchCards.map((card, index) => ({
          id: `right-${batchIndex}-${index}-${card.id}`,
          sourceCardId: card.id,
          text: getEnglishAnswer(card),
          cefrLevel: card.cefrLevel ?? undefined
        }))
      )
    })
  }

  return batches
}

function getStageLabel(stage: ReviewStage) {
  return REVIEW_STEPS.find((item) => item.value === stage)?.label ?? "Stage"
}

interface ReviewSessionProps {
  initialData?: CardsResponse | null
}

export function ReviewSession({ initialData = null }: ReviewSessionProps) {
  const [guestMode, setGuestMode] = useState(false)
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
  const [sessionResults, setSessionResults] = useState<Record<string, ReviewResult>>({})
  const [claiming, setClaiming] = useState(false)
  const [dailyCatalog, setDailyCatalog] = useState<DailyCatalogStatus | null>(null)
  const [dailyModalOpen, setDailyModalOpen] = useState(false)
  const [lastActionStatus, setLastActionStatus] = useState<"idle" | "correct" | "incorrect" | "active">("idle")
  const [savedPracticeSession, setSavedPracticeSession] = useState<SavedPracticeSession | null>(null)
  const [challengeDismissed, setChallengeDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const isRecoveryMode = searchParams.get("mode") === "recovery"
  const { showToast } = useToast()
  const todayKey = getTodayDateKey()

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    data: cardsPayload,
    loading,
    revalidate
  } = useClientResource<CardsResponse>({
    key: "cards:collection",
    enabled: !guestMode,
    initialData,
    staleTimeMs: 60_000,
    revalidateOnMount: initialData === null,
    loader: async () => {
      const response = await fetch("/api/cards")

      if (!response.ok) {
        throw new Error("Could not load cards.")
      }

      return (await response.json()) as CardsResponse
    },
    onError: () => {
      showToast("Could not load review cards.", "error")
    }
  })

  useEffect(() => {
    const guestActive = isGuestSessionActive()
    setGuestMode(guestActive)

    if (!guestActive) {
      return
    }

    const cards = sortDueCards(getGuestCards())
    setAllCards(cards)
    setDueCards(cards.filter((card) => card.nextReviewDate <= todayKey))
    setStreak(getGuestStreak())
    setReviewLives(DEFAULT_GUEST_REVIEW_LIVES)
  }, [todayKey])

  useEffect(() => {
    if (guestMode || !cardsPayload) {
      return
    }

    const sortedCards = sortDueCards(cardsPayload.cards)
    setAllCards(sortedCards)
    setDueCards(sortedCards.filter((card) => card.nextReviewDate <= todayKey))
    setStreak(cardsPayload.summary.streak)
    setReviewLives(cardsPayload.summary.reviewLives)
    setDailyCatalog(cardsPayload.dailyCatalog)
  }, [cardsPayload, guestMode, todayKey])

  useEffect(() => {
    if (guestMode) {
      setSavedPracticeSession(null)
      return
    }

    let canceled = false

    async function loadSavedPracticeSession() {
      try {
        const response = await fetch("/api/practice/session", {
          cache: "no-store"
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as {
          session: SavedPracticeSession | null
        }

        if (!canceled) {
          setSavedPracticeSession(payload.session)
        }
      } catch {
        if (!canceled) {
          setSavedPracticeSession(null)
        }
      }
    }

    void loadSavedPracticeSession()

    return () => {
      canceled = true
    }
  }, [guestMode])

  const availableCards = useMemo(
    () => dueCards.filter((card) => matchesCardStatus(card, selectedStatus)),
    [dueCards, selectedStatus]
  )
  const dailyDueCards = useMemo(() => {
    const dailyTarget = isRecoveryMode ? 7 : (dailyCatalog?.dailyTarget ?? 10)
    return availableCards.slice(0, dailyTarget)
  }, [availableCards, dailyCatalog?.dailyTarget, isRecoveryMode])
  const allAvailableCards = useMemo(
    () => allCards.filter((card) => matchesCardStatus(card, selectedStatus)),
    [allCards, selectedStatus]
  )
  const weakCards = useMemo(
    () => allCards.filter((card) => (card.wrongCount * 2 - card.correctCount) >= 3),
    [allCards]
  )
  const activeStage = REVIEW_STEPS[activeStageIndex]?.value ?? "flip"
  const currentCard = useMemo(
    () =>
      activeStage === "flip"
        ? sessionCards[flipIndex]
        : activeStage === "write"
          ? sessionCards[writeIndex]
          : null,
    [activeStage, flipIndex, sessionCards, writeIndex]
  )
  const currentQuizBatch = quizBatches[quizBatchIndex]
  const resumableCards = useMemo(() => {
    if (!savedPracticeSession) {
      return []
    }

    const cardsById = new Map(allCards.map((card) => [card.id, card]))
    return savedPracticeSession.cardIds
      .map((cardId) => cardsById.get(cardId))
      .filter((card): card is CardRecord => Boolean(card))
  }, [allCards, savedPracticeSession])
  const resumableSession =
    savedPracticeSession && resumableCards.length
      ? {
          wordCount: resumableCards.length,
          activeStage: savedPracticeSession.activeStage,
          completedStages: savedPracticeSession.completedStages
        }
      : null

  function refreshCardCollections(nextCards: CardRecord[], shouldRevalidate = true) {
    const sortedCards = sortDueCards(nextCards)
    setAllCards(sortedCards)
    setDueCards(sortedCards.filter((card) => card.nextReviewDate <= todayKey))
    if (shouldRevalidate) {
      void revalidate()
    }
  }

  function handleDailyClaimed(payload: DailyClaimResponse) {
    setDailyCatalog({
      dailyTarget: payload.dailyTarget,
      todayCount: payload.todayCount,
      savedCount: payload.savedCount,
      waitingCount: payload.waitingCount,
      claimedToday: payload.claimedToday,
      dailyLimit: payload.dailyLimit,
      remainingToday: payload.remainingToday,
      cefrLevel: dailyCatalog?.cefrLevel ?? "A1"
    })

    if (payload.cards.length) {
      refreshCardCollections([...payload.cards, ...allCards])
      showToast(`${payload.createdCount} word${payload.createdCount === 1 ? "" : "s"} added.`, "success")
      return
    }

    if (payload.limitReached) {
      showToast("Today's word limit is reached.", "success")
      return
    }

    showToast("No words were selected.", "error")
  }

  function handleClaimDailyWords() {
    if (guestMode || claiming) {
      return
    }

    setDailyModalOpen(true)
  }

  async function clearSavedPracticeSession() {
    setSavedPracticeSession(null)

    if (guestMode) {
      return
    }

    try {
      await fetch("/api/practice/session", {
        method: "DELETE"
      })
    } catch {
      // A stale resume card is harmless; the next successful save will replace it.
    }
  }

  async function savePracticeProgress({
    cardIds = sessionCards.map((card) => card.id),
    stages = completedStages,
    stage = activeStage,
    flow = sessionFlow
  }: {
    cardIds?: string[]
    stages?: ReviewStage[]
    stage?: ReviewStage
    flow?: ReviewFlow
  } = {}) {
    if (guestMode || !cardIds.length) {
      return
    }

    try {
      const response = await fetch("/api/practice/session", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cardIds,
          completedStages: stages,
          activeStage: stage,
          selectedStatus,
          flow,
          state: {
            mistakes,
            stageAttempt,
            results: sessionResults
          }
        })
      })

      if (!response.ok) {
        return
      }

      const payload = (await response.json()) as {
        session: SavedPracticeSession
      }
      setSavedPracticeSession(payload.session)
    } catch {
      // Practice should remain playable even when background progress sync fails.
    }
  }

  function startSession(
    cards: CardRecord[],
    startStage: ReviewStage = "flip",
    flow: ReviewFlow = "linked",
    options: {
      completed?: ReviewStage[]
      preserveOrder?: boolean
      restoreState?: SavedPracticeSession["state"]
    } = {}
  ) {
    const startIndex = REVIEW_STEPS.findIndex((item) => item.value === startStage)
    const sessionDeck = (options.preserveOrder ? cards : shuffleItems(cards)).slice(0, PRACTICE_SESSION_LIMIT)

    if (cardsPayload?.summary.isFirstPractice && !guestMode) {
      trackEvent("first_practice_started")
    }

    setSessionCards(sessionDeck)
    setQuizBatches(buildQuizBatches(sessionDeck))
    setActiveStageIndex(startIndex >= 0 ? startIndex : 0)
    setCompletedStages(options.completed ?? [])
    setLivesRemaining(reviewLives)
    setFlipIndex(0)
    setQuizBatchIndex(0)
    setQuizSolvedPairs(0)
    setWriteIndex(0)
    setMistakes(options.restoreState?.mistakes ?? 0)
    setSessionResults(options.restoreState?.results ?? {})
    setStageAttempt(options.restoreState?.stageAttempt ?? 0)
    setSessionFlow(flow)
    setSessionStatus("active")
    setLastActionStatus("active")
  }

  function startNewSession(cards: CardRecord[], startStage: ReviewStage = "flip", flow: ReviewFlow = "linked") {
    void clearSavedPracticeSession()
    startSession(cards, startStage, flow)
  }

  function resumeSavedSession() {
    if (!savedPracticeSession || !resumableCards.length) {
      showToast("Saved practice session is no longer available.", "error")
      void clearSavedPracticeSession()
      return
    }

    setSelectedStatus(savedPracticeSession.selectedStatus)
    startSession(resumableCards, savedPracticeSession.activeStage, savedPracticeSession.flow, {
      completed: savedPracticeSession.completedStages,
      preserveOrder: true,
      restoreState: savedPracticeSession.state
    })
  }

  function restartSavedSession() {
    if (!savedPracticeSession || !resumableCards.length) {
      void clearSavedPracticeSession()
      return
    }

    setSelectedStatus(savedPracticeSession.selectedStatus)
    startSession(resumableCards, "flip", savedPracticeSession.flow, {
      preserveOrder: true
    })
    void clearSavedPracticeSession()
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
    void savePracticeProgress({
      stage
    })
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
    const nextCompletedStages = completedStages.includes(stage)
      ? completedStages
      : [...completedStages, stage]

    setCompletedStages(nextCompletedStages)
    setLivesRemaining(reviewLives)
    setStageAttempt((current) => current + 1)
    setQuizSolvedPairs(0)

    if (stage === "flip") {
      setActiveStageIndex(1)
      setQuizBatchIndex(0)
      void savePracticeProgress({
        stages: nextCompletedStages,
        stage: "quiz"
      })
      return
    }

    if (stage === "quiz") {
      setActiveStageIndex(2)
      setWriteIndex(0)
      void savePracticeProgress({
        stages: nextCompletedStages,
        stage: "write"
      })
      return
    }

    if (stage === "write") {
      setActiveStageIndex(3)
      void savePracticeProgress({
        stages: nextCompletedStages,
        stage: "challenge"
      })
    }
  }

  function handleExitSession() {
    if (sessionCards.length) {
      void savePracticeProgress()
    }

    setSessionStatus("idle")
  }

  async function commitSession() {
    setSessionStatus("saving")

    try {
      if (guestMode) {
        const nextCards = commitGuestReviewSession(sessionCards.map((card) => card.id))
        refreshCardCollections(nextCards, false)
        setStreak(getGuestStreak())
      } else {
        const response = await fetch("/api/review/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            isRecovery: isRecoveryMode,
            reviews: Array.from(new Set(sessionCards.map((card) => card.id))).map((cardId) => ({
              cardId,
              result: sessionResults[cardId] === "unknown" ? "unknown" : "known"
            }))
          })
        })

        if (!response.ok) {
          throw new Error("Session save failed.")
        }

        const payload = (await response.json()) as {
          updatedCardIds: string[]
          streak: number
        }
        const updatedIds = new Set(payload.updatedCardIds)
        const nextCards = allCards.map((card) => {
          if (!updatedIds.has(card.id)) {
            return card
          }

          const cardResult = sessionResults[card.id] === "unknown" ? "unknown" : "known"
          const outcome = getReviewOutcome(cardResult, todayKey)

          return {
            ...card,
            nextReviewDate: outcome.nextReviewDate,
            lastReviewResult: outcome.lastReviewResult,
            reviewCount: card.reviewCount + outcome.reviewCountDelta,
            correctCount: card.correctCount + outcome.correctCountDelta,
            wrongCount: card.wrongCount + outcome.wrongCountDelta
          }
        })
        refreshCardCollections(nextCards, false)
        setStreak(payload.streak)
      }

      setCompletedStages((current) =>
        current.includes("write") ? current : [...current, "write"]
      )
      setChallengeDismissed(false)
      void clearSavedPracticeSession()
      setSessionStatus("success")
    } catch {
      setSessionStatus("save-error")
      showToast("Could not save session.", "error")
    }
  }

  function handleFlipResolved(result: ReviewResult) {
    if (result === "unknown") {
      setLastActionStatus("incorrect")
      const cardId = sessionCards[flipIndex].id
      setSessionResults((current) => ({ ...current, [cardId]: "unknown" }))
      if (spendLife()) return
    } else {
      setLastActionStatus("correct")
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

  function handleQuizLifeLost(cardId?: string) {
    setLastActionStatus("incorrect")
    if (cardId) {
      setSessionResults((current) => ({ ...current, [cardId]: "unknown" }))
    }
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
    if (result === "unknown") {
      setLastActionStatus("incorrect")
      const cardId = sessionCards[writeIndex].id
      setSessionResults((current) => ({ ...current, [cardId]: "unknown" }))
      if (spendLife()) return
    } else {
      setLastActionStatus("correct")
    }

    if (writeIndex + 1 >= sessionCards.length) {
      if (sessionFlow === "single") {
        void commitSession()
        return
      }
      advanceToNextStage("write")
      return
    }

    setWriteIndex((current) => current + 1)
  }

  function getActiveStageProgress() {
    if (!sessionCards.length) {
      return 0
    }

    if (activeStage === "flip") {
      return Math.round((flipIndex / sessionCards.length) * 100)
    }

    if (activeStage === "write") {
      return Math.round((writeIndex / sessionCards.length) * 100)
    }

    if (activeStage === "challenge") {
      return 100
    }

    const completedPairs = quizBatches
      .slice(0, quizBatchIndex)
      .reduce((total, batch) => total + batch.targetCount, 0)
    const currentPair = Math.min(completedPairs + quizSolvedPairs, sessionCards.length)

    return Math.round((currentPair / sessionCards.length) * 100)
  }

  function getStageCounterLabel() {
    if (activeStage === "flip") {
      return `Card ${Math.min(flipIndex + 1, sessionCards.length)} of ${sessionCards.length}`
    }

    if (activeStage === "write") {
      return `Card ${Math.min(writeIndex + 1, sessionCards.length)} of ${sessionCards.length}`
    }

    if (activeStage === "challenge") {
      return "Final Challenge"
    }

    const totalPairs = sessionCards.length
    const completedPairs = quizBatches
      .slice(0, quizBatchIndex)
      .reduce((total, batch) => total + batch.targetCount, 0)
    const currentPair = Math.min(
      completedPairs + quizSolvedPairs + 1,
      totalPairs
    )

    return `Pair ${currentPair} of ${totalPairs}`
  }

  const progress = useMemo(() => getActiveStageProgress(), [
    activeStage,
    flipIndex,
    quizBatchIndex,
    quizBatches,
    quizSolvedPairs,
    sessionCards.length,
    writeIndex
  ])
  const stageCounterLabel = useMemo(() => getStageCounterLabel(), [
    activeStage,
    flipIndex,
    quizBatchIndex,
    quizBatches,
    quizSolvedPairs,
    sessionCards.length,
    writeIndex
  ])

  if (!mounted) {
    return (
      <div className={styles.sessionContainer}>
        <PracticeBackground status="idle" />
      </div>
    )
  }

  if (sessionStatus === "idle") {
    return (
      <div>
        <PracticeBackground status="idle" />
        <ReviewSessionOverview
          loading={loading && !cardsPayload && !guestMode}
          currentStage={resumableSession?.activeStage ?? "flip"}
          completedStages={resumableSession?.completedStages ?? []}
          cardsDue={dailyDueCards.length}
          totalCards={allAvailableCards.length}
          weakCardsCount={weakCards.length}
          selectedStatus={selectedStatus}
          practiceStage={practiceStage}
          guestMode={guestMode}
          claiming={claiming}
          dailyCatalog={dailyCatalog}
          sessionLimit={PRACTICE_SESSION_LIMIT}
          resumableSession={resumableSession}
          onSelectStatus={setSelectedStatus}
          onSelectPracticeStage={setPracticeStage}
          onClaimDailyWords={handleClaimDailyWords}
          onStartDue={() => startNewSession(dailyDueCards, "flip", "linked")}
          onStartPractice={() => startNewSession(allAvailableCards, practiceStage, "single")}
          onResumeSession={resumeSavedSession}
          onRestartSession={restartSavedSession}
          onStartWeakWords={() => startNewSession(weakCards, "flip", "single")}
        />
        <DailyWordsModal
          open={dailyModalOpen}
          dailyCatalog={dailyCatalog}
          onClose={() => {
            setDailyModalOpen(false)
            setClaiming(false)
          }}
          onClaimed={(payload) => {
            setClaiming(false)
            handleDailyClaimed(payload)
          }}
        />
      </div>
    )
  }

  if (sessionStatus === "saving" || sessionStatus === "save-error") {
    return (
      <div className={`${styles.sessionContainer} flex items-center justify-center`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.heroCard}
          style={{ maxWidth: "24rem", textAlign: "center" }}
        >
          <div className={styles.heroCardGlow} />
          <div className="flex justify-center mb-6">
            <div className={styles.heroIconWrap}>
              {sessionStatus === "saving" ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white" />
              ) : (
                <Zap className="text-rose-500" size={24} />
              )}
            </div>
          </div>
          <h2 className={styles.heroTitle}>
            {sessionStatus === "saving" ? "Saving Progress" : "Sync Failed"}
          </h2>
          <p className={styles.heroSubtitle} style={{ marginBottom: "2rem" }}>
            {sessionStatus === "saving"
              ? "Your achievements are being uploaded to the cloud..."
              : "We couldn't reach the server. Don't worry, your progress is safe locally."}
          </p>
          
          <div className={styles.heroActions}>
            {sessionStatus === "save-error" && (
              <button
                type="button"
                onClick={() => void commitSession()}
                className={styles.glassButtonPrimary}
              >
                Retry Sync
              </button>
            )}
            <Link href="/" className={styles.glassButtonSecondary}>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (sessionStatus === "success") {
    return (
      <div className={`${styles.sessionContainer} flex items-center justify-center`}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.heroCard}
          style={{ maxWidth: "28rem", textAlign: "center" }}
        >
          <div className={styles.heroCardGlow} style={{ background: "radial-gradient(circle at center, rgba(34, 197, 94, 0.15), transparent 70%)" }} />
          
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
            <div className={styles.heroIconWrap} style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#22c55e", border: "none" }}>
              <CheckCircle2 size={40} className="text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className={styles.heroTitle} style={{ fontSize: "1.75rem" }}>
            {isRecoveryMode ? "Streak Restored!" : "Session Complete!"}
          </h1>
          <p className={styles.heroSubtitle}>
            {isRecoveryMode 
              ? "Your learning streak is safe. Good to have you back." 
              : "Good. Tomorrow we’ll test the words you almost forgot."}
          </p>

          <div className={styles.heroStats} style={{ marginTop: "2rem", marginBottom: "2rem" }}>
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatValue}>{sessionCards.length}</span>
              <span className={styles.heroStatLabel}>Cards Done</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatValue}>{mistakes}</span>
              <span className={styles.heroStatLabel}>Mistakes</span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <Link href="/" className={styles.glassButtonPrimary}>
              <ArrowRight size={18} />
              Return to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!currentCard && activeStage !== "quiz" && activeStage !== "challenge") {
    return null
  }

  return (
    <div className={styles.sessionContainer}>
      <PracticeBackground status={lastActionStatus} />
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.floatingSessionHeader}
      >
        <div className={styles.sessionHeaderTop}>
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={handleExitSession}
              className={styles.sessionBackButton}
            >
              <ArrowLeft size={16} />
            </button>
            <div className={styles.sessionHeaderMeta}>
              <span className={styles.sessionHeaderEyebrow}>Stage {activeStageIndex + 1}/{REVIEW_STEPS.length}</span>
              <div className="mt-0.5 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                <h2 className={styles.sessionHeaderTitle} style={{ letterSpacing: "0.02em" }}>{getStageLabel(activeStage)}</h2>
              </div>
            </div>
          </div>

          <div className={styles.sessionHeaderStatus}>
            <div className={styles.sessionCounterGroup}>
              <span className={styles.sessionHeaderEyebrow}>{stageCounterLabel}</span>
              <div className={styles.livesIndicator}>
                {Array.from({ length: reviewLives }).map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={false}
                    animate={{ 
                      scale: i < livesRemaining ? 1 : 0.8,
                      opacity: i < livesRemaining ? 1 : 0.2
                    }}
                    className={`${styles.lifePill} ${i < livesRemaining ? styles.lifePillActive : ""}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sessionProgressBar}>
          <motion.div
            className={styles.sessionProgressFill}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.header>

      <div className={`${styles.sessionStageArea} px-4`}>
        <div className="mx-auto w-full max-w-[40rem]">
          {activeStage !== "challenge" ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeStage}-${stageAttempt}-${currentCard?.id ?? quizBatchIndex}`}
                initial={{ opacity: 0, scale: 0.98, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -5 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {activeStage === "flip" && (
                  <FlipCard
                    card={currentCard as CardRecord}
                    onAnswer={handleFlipResolved}
                  />
                )}

                {activeStage === "quiz" && currentQuizBatch && (
                  <QuizCard
                    leftItems={currentQuizBatch.leftItems}
                    rightItems={currentQuizBatch.rightItems}
                    batchIndex={quizBatchIndex}
                    totalBatches={quizBatches.length}
                    targetCount={currentQuizBatch.targetCount}
                    onLifeLost={handleQuizLifeLost}
                    onBatchCompleted={handleQuizBatchCompleted}
                    onProgressChange={setQuizSolvedPairs}
                  />
                )}

                {activeStage === "write" && (
                  <WriteCard
                    card={currentCard as CardRecord}
                    onResolved={handleWriteResolved}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div style={{ opacity: 1 }}>
              <PracticeWritingChallenge
                targetCards={sessionCards}
                onSkip={() => void commitSession()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

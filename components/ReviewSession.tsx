"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Zap, Trophy, ArrowUpRight, Plus } from "lucide-react"
import Link from "next/link"
import { Outfit } from "next/font/google"
import { useEffect, useState } from "react"

import { FlipCard } from "@/components/FlipCard"
import { QuizCard, type QuizMatchItem } from "@/components/QuizCard"
import { ReviewSessionOverview } from "@/components/ReviewSessionOverview"
import { WriteCard } from "@/components/WriteCard"
import { PracticeBackground } from "@/components/PracticeBackground"
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
import type { CardRecord, CardsResponse, CardStatusFilter, DailyCatalogStatus, DailyClaimResponse, ReviewResult } from "@/lib/types"

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
          text: getEnglishAnswer(card),
          cefrLevel: card.cefrLevel
        }))
      )
    })
  }

  return batches
}

function getStageLabel(stage: ReviewStage) {
  return REVIEW_STEPS.find((item) => item.value === stage)?.label ?? "Stage"
}

function SkeletonPractice() {
  return (
    <div className={styles.commandCenter}>
      <div className="flex justify-center mb-5">
        <div className="skeleton h-10 w-48 rounded-full" />
      </div>
      <div className={styles.heroCard}>
        <div className="flex items-center gap-4 mb-8">
          <div className="skeleton h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-32 rounded-lg" />
            <div className="skeleton h-4 w-48 rounded-lg" />
          </div>
        </div>
        <div className="skeleton h-32 w-full rounded-2xl mb-8" />
        <div className="skeleton h-16 w-full rounded-2xl mb-8" />
        <div className="skeleton h-14 w-full rounded-2xl" />
      </div>
    </div>
  )
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
  const [claiming, setClaiming] = useState(false)
  const [dailyCatalog, setDailyCatalog] = useState<DailyCatalogStatus | null>(null)
  const [lastActionStatus, setLastActionStatus] = useState<"idle" | "correct" | "incorrect" | "active">("idle")
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
        setTimeout(() => setLoading(false), 600)
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
        setDailyCatalog(payload.dailyCatalog)
      } catch {
        showToast("Could not load review cards.", "error")
      } finally {
        setTimeout(() => setLoading(false), 600)
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

  async function handleClaimDailyWords() {
    if (guestMode || claiming) {
      return
    }

    setClaiming(true)

    try {
      const response = await fetch("/api/cards/daily", {
        method: "POST"
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not add today's words.")
      }

      const payload = (await response.json()) as DailyClaimResponse

      setDailyCatalog({
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

      showToast("No matching words for your level.", "error")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not add today's words.",
        "error"
      )
    } finally {
      setClaiming(false)
    }
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
    setLastActionStatus("active")
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
      showToast("Could not save session.", "error")
    }
  }

  function handleFlipResolved(result: ReviewResult) {
    if (result === "unknown") {
      setLastActionStatus("incorrect")
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

  function handleQuizLifeLost() {
    setLastActionStatus("incorrect")
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
      if (spendLife()) return
    } else {
      setLastActionStatus("correct")
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
    return <SkeletonPractice />
  }

  if (sessionStatus === "idle") {
    return (
      <div className={outfit.className}>
        <PracticeBackground status="idle" />
        <ReviewSessionOverview
          currentStage="flip"
          completedStages={[]}
          cardsDue={availableCards.length}
          totalCards={allAvailableCards.length}
          selectedStatus={selectedStatus}
          practiceStage={practiceStage}
          guestMode={guestMode}
          claiming={claiming}
          dailyCatalog={dailyCatalog}
          onSelectStatus={setSelectedStatus}
          onSelectPracticeStage={setPracticeStage}
          onClaimDailyWords={handleClaimDailyWords}
          onStartDue={() => startSession(availableCards, "flip", "linked")}
          onStartPractice={() => startSession(allAvailableCards, practiceStage, "single")}
        />
      </div>
    )
  }

  if (sessionStatus === "saving" || sessionStatus === "save-error") {
    return (
      <div className={`${styles.sessionContainer} flex items-center justify-center ${outfit.className}`}>
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
      <div className={`${styles.sessionContainer} flex items-center justify-center ${outfit.className}`}>
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

          <h1 className={styles.heroTitle} style={{ fontSize: "1.75rem" }}>Session Complete!</h1>
          <p className={styles.heroSubtitle}>You've made significant progress today.</p>

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

  if (!currentCard && activeStage !== "quiz") {
    return null
  }

  const progress = getActiveStageProgress()

  return (
    <div className={`${styles.sessionContainer} ${outfit.className}`}>
      <PracticeBackground status={lastActionStatus} />
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.floatingSessionHeader}
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSessionStatus("idle")}
            className={styles.sessionBackButton}
          >
            <ArrowLeft size={16} />
          </button>
          <div className={styles.sessionHeaderMeta}>
            <span className={styles.sessionHeaderEyebrow}>Stage {activeStageIndex + 1}/3</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <h2 className={styles.sessionHeaderTitle} style={{ letterSpacing: "0.02em" }}>{getStageLabel(activeStage)}</h2>
            </div>
          </div>
        </div>

        <div className={styles.sessionHeaderStatus}>
          <div className={styles.sessionCounterGroup}>
            <span className={styles.sessionHeaderEyebrow}>{getStageCounterLabel()}</span>
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

        <div className={styles.sessionProgressBar}>
          <motion.div
            className={styles.sessionProgressFill}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.header>

      <div className={styles.sessionStageArea}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeStage}-${stageAttempt}-${currentCard?.id ?? quizBatchIndex}`}
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -5 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
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
      </div>
    </div>
  )
}

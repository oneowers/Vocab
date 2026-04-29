"use client"

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { trackEvent } from "@/lib/analytics"

import { useToast } from "@/components/Toast"
import type { CefrLevel } from "@/lib/types"
import type { VocabularyLevelTestPayload, VocabularyLevelTestResult } from "@/lib/vocabulary-level-test"

interface VocabularyLevelTestProps {
  initialTest: VocabularyLevelTestPayload
}

const LEVEL_LABELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

export function VocabularyLevelTest({ initialTest }: VocabularyLevelTestProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<VocabularyLevelTestResult | null>(null)
  const questions = initialTest.questions
  const activeQuestion = questions[questionIndex]
  const answeredCount = Object.keys(answers).length
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0
  const selectedOptionId = activeQuestion ? answers[activeQuestion.id] : null
  const currentLevelIndex = activeQuestion ? LEVEL_LABELS.indexOf(activeQuestion.cefrLevel) : 0
  const confidenceByLevel = result?.confidenceByLevel ?? LEVEL_LABELS.reduce<Record<CefrLevel, number>>(
    (accumulator, level, index) => {
      accumulator[level] = Math.max(0, Math.min(100, progress - Math.max(0, index - currentLevelIndex) * 18))
      return accumulator
    },
    {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0
    }
  )
  const canSubmit = answeredCount === questions.length && !submitting
  const answerPayload = useMemo(
    () =>
      questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: answers[question.id] ?? ""
      })),
    [answers, questions]
  )

  useEffect(() => {
    trackEvent("level_test_started")
  }, [])

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId
    }))
  }

  async function handleNext() {
    if (!activeQuestion || !selectedOptionId) {
      showToast("Choose one answer to continue.", "error")
      return
    }

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((current) => current + 1)
      return
    }

    if (!canSubmit) {
      showToast("Answer all 10 questions to finish.", "error")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/onboarding/level-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          answers: answerPayload
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not save test result.")
      }

      const payload = (await response.json()) as { result: VocabularyLevelTestResult }
      setResult(payload.result)
      trackEvent("level_test_completed")
      router.refresh()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not save test result.",
        "error"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!questions.length) {
    return (
      <div className="panel p-6">
        <p className="text-[16px] font-semibold text-white">No catalog words are available for the test yet.</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="panel w-full p-6 md:p-8">
        <p className="section-label">Result</p>
        <h1 className="mt-3 text-[30px] font-bold tracking-normal text-white">
          Estimated level: {result.estimatedLevel}
        </h1>
        <p className="mt-3 text-[15px] text-text-secondary">
          C2 confidence: {result.confidenceByLevel.C2}%
        </p>

        <div className="mt-8 space-y-3">
          {LEVEL_LABELS.map((level) => (
            <div key={level} className="grid grid-cols-[40px_1fr_44px] items-center gap-3">
              <span className="text-[13px] font-bold text-white/70">{level}</span>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${result.confidenceByLevel[level]}%` }}
                />
              </div>
              <span className="text-right text-[12px] font-semibold text-text-tertiary">
                {result.confidenceByLevel[level]}%
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-tertiary">Correct</p>
            <p className="mt-2 text-[24px] font-bold text-white">{result.correctCount}</p>
          </div>
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-tertiary">Mistakes</p>
            <p className="mt-2 text-[24px] font-bold text-white">{result.mistakesCount}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/onboarding/words")}
          className="button-primary mt-8 w-full justify-center"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="panel w-full p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="section-label">Vocabulary test</p>
        <p className="text-[12px] font-semibold text-text-tertiary">
          {answeredCount}/10
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        {LEVEL_LABELS.map((level, index) => (
          <div key={level} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className={`text-[12px] font-bold ${index <= currentLevelIndex ? "text-white" : "text-white/30"}`}>
              {level}
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-white/80"
                style={{ width: `${confidenceByLevel[level]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          Question {questionIndex + 1}
        </p>
        <h1 className="mt-3 text-[30px] font-bold tracking-normal text-white">
          {activeQuestion.word}
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Choose the closest meaning.
        </p>
      </div>

      <div className="mt-7 grid gap-3">
        {activeQuestion.options.map((option) => {
          const active = selectedOptionId === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(activeQuestion.id, option.id)}
              className={`flex min-h-[58px] items-center justify-between rounded-[18px] border px-4 py-3 text-left transition ${
                active
                  ? "border-white bg-white text-black"
                  : "border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05]"
              }`}
            >
              <span className="text-[15px] font-semibold">{option.text}</span>
              {active ? <CheckCircle2 size={18} /> : null}
            </button>
          )
        })}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))}
          disabled={questionIndex === 0 || submitting}
          className="button-secondary min-w-[108px] justify-center disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => void handleNext()}
          disabled={submitting}
          className="button-primary min-w-[156px] justify-center"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving
            </>
          ) : questionIndex === questions.length - 1 ? (
            "See result"
          ) : (
            <>
              Next
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

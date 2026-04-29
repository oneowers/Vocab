"use client"

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"

import { useToast } from "@/components/Toast"
import type { CardRecord, PracticeWritingChallengeResult } from "@/lib/types"

interface PracticeWritingChallengeProps {
  targetCards: CardRecord[]
  onSkip: () => void
}

export function PracticeWritingChallenge({
  targetCards,
  onSkip
}: PracticeWritingChallengeProps) {
  const { showToast } = useToast()
  const [userText, setUserText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PracticeWritingChallengeResult | null>(null)

  async function handleSubmit() {
    if (!userText.trim()) {
      showToast("Write a short English text first.", "error")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/practice/writing-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cardIds: targetCards.map((card) => card.id),
          userText: userText.trim()
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not check your writing.")
      }

      const payload = (await response.json()) as {
        result: PracticeWritingChallengeResult
      }
      setResult(payload.result)
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not check your writing.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="mt-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="section-label">AI feedback</p>
            <h2 className="mt-1 text-[24px] font-bold text-white">Score: {result.score}/100</h2>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              Feedback
            </p>
            <p className="mt-2 text-[15px] leading-7 text-text-secondary">{result.levelFeedback}</p>
          </div>

          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              Target words
            </p>
            <div className="mt-3 space-y-2">
              {result.usedWords.map((item) => (
                <div
                  key={item.word}
                  className="rounded-[18px] border border-white/[0.08] bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-semibold text-white">{item.word}</span>
                    <span className="text-[12px] font-semibold text-text-secondary">
                      {item.used ? (item.correct ? "used well" : "used with issues") : "not used"}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-text-secondary">{item.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              What was good
            </p>
            <p className="mt-2 text-[15px] leading-7 text-text-secondary">{result.whatWasGood}</p>
          </div>

          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              Grammar
            </p>
            {result.grammarMistakes.length ? (
              <div className="mt-3 space-y-2">
                {result.grammarMistakes.map((mistake, index) => (
                  <div
                    key={`${mistake.original}-${index}`}
                    className="rounded-[18px] border border-white/[0.08] bg-black/20 px-4 py-3"
                  >
                    <p className="text-[13px] font-semibold text-white/80">{mistake.original}</p>
                    <p className="mt-1 text-[14px] font-semibold text-white">{mistake.corrected}</p>
                    <p className="mt-2 text-[13px] leading-6 text-text-secondary">
                      {mistake.explanationRu}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[15px] leading-7 text-text-secondary">
                Грубых грамматических ошибок AI не нашёл.
              </p>
            )}
          </div>

          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              Improved version
            </p>
            <p className="mt-2 rounded-[18px] border border-white/[0.08] bg-black/20 px-4 py-4 text-[15px] leading-7 text-white/90">
              {result.improvedText}
            </p>
          </div>

          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              Next task
            </p>
            <p className="mt-2 text-[15px] leading-7 text-text-secondary">{result.nextTask}</p>
          </div>
        </div>

        <button type="button" onClick={onSkip} className="button-primary mt-6 w-full justify-center">
          Return to dashboard
          <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Optional AI challenge</p>
          <h2 className="mt-2 text-[24px] font-bold text-white">Use these words in a short text</h2>
          <p className="mt-2 text-[15px] leading-7 text-text-secondary">
            Write a short English text. AI will check the target words, grammar, naturalness, and
            give you feedback in Russian.
          </p>
        </div>
        <button type="button" onClick={onSkip} className="button-secondary shrink-0">
          Skip
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {targetCards.map((card) => (
          <span
            key={card.id}
            className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[13px] font-semibold text-white/85"
          >
            {card.original}
          </span>
        ))}
      </div>

      <textarea
        value={userText}
        onChange={(event) => setUserText(event.target.value)}
        placeholder="Write 3–6 sentences in English using today's words."
        className="mt-5 min-h-[180px] w-full rounded-[22px] border border-white/[0.08] bg-black/20 px-4 py-4 text-[15px] leading-7 text-white outline-none transition placeholder:text-text-tertiary focus:border-white/[0.18]"
      />

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className="button-primary mt-5 w-full justify-center"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Checking text
          </>
        ) : (
          "Check my text"
        )}
      </button>
    </div>
  )
}

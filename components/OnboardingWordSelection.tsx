"use client"

import { ArrowRight, Loader2, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useToast } from "@/components/Toast"
import type { DailyWordCandidate, OnboardingWordSelectionPayload } from "@/lib/types"

interface OnboardingWordSelectionProps {
  initialSelection: OnboardingWordSelectionPayload
}

export function OnboardingWordSelection({ initialSelection }: OnboardingWordSelectionProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [items, setItems] = useState(initialSelection.items)
  const [busyWordId, setBusyWordId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  async function handleSwap(action: "replace" | "know", item: DailyWordCandidate) {
    setBusyWordId(item.id)

    try {
      const response = await fetch("/api/onboarding/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          wordId: item.id,
          preferredLevel: item.cefrLevel,
          currentWordIds: items.map((current) => current.id)
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not update this word.")
      }

      const payload = (await response.json()) as { item: DailyWordCandidate | null }

      setItems((current) => {
        const nextItems = current.filter((currentItem) => currentItem.id !== item.id)

        if (payload.item) {
          return [...nextItems, payload.item]
        }

        return nextItems
      })
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not update this word.", "error")
    } finally {
      setBusyWordId(null)
    }
  }

  async function handleStartPractice() {
    if (!items.length) {
      showToast("Choose at least one word to start practice.", "error")
      return
    }

    setStarting(true)

    try {
      const response = await fetch("/api/onboarding/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "start",
          wordIds: items.map((item) => item.id)
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not start practice.")
      }

      router.push("/practice")
      router.refresh()
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not start practice.", "error")
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="panel w-full p-6 md:p-8">
      <p className="section-label">First daily set</p>
      <h1 className="mt-3 text-[30px] font-bold tracking-normal text-white">
        Start with 5 words around your level
      </h1>
      <p className="mt-3 text-[15px] leading-7 text-text-secondary">
        We matched this first set around {initialSelection.estimatedLevel}. Replace any word that
        feels off, or mark it as already known.
      </p>

      <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-text-tertiary">
        {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
          <div key={level} className="flex items-center gap-2">
            <span className={level === initialSelection.estimatedLevel ? "text-white" : ""}>{level}</span>
            {level !== "C2" ? <span className="text-white/20">•</span> : null}
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {items.map((item) => {
          const busy = busyWordId === item.id

          return (
            <div
              key={item.id}
              className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/70">
                    {item.cefrLevel}
                  </div>
                  <h2 className="mt-3 text-[24px] font-bold tracking-[-0.04em] text-white">
                    {item.word}
                  </h2>
                  <p className="mt-1 text-[15px] text-text-secondary">{item.translation}</p>
                  {item.example ? (
                    <p className="mt-3 text-[13px] leading-6 text-text-tertiary">{item.example}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleSwap("replace", item)}
                  disabled={busy || starting}
                  className="button-secondary min-w-[124px] justify-center disabled:opacity-40"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => void handleSwap("know", item)}
                  disabled={busy || starting}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-white/[0.06] disabled:opacity-40"
                >
                  I know this
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => void handleStartPractice()}
        disabled={starting || !items.length}
        className="button-primary mt-8 w-full justify-center"
      >
        {starting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Starting practice
          </>
        ) : (
          <>
            Start practice
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  )
}

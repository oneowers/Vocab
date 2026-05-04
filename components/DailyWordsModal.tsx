"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, Sparkles, X } from "lucide-react"

import { useToast } from "@/components/Toast"
import type {
  DailyCatalogStatus,
  DailyClaimResponse,
  DailyWordCandidate,
  DailyWordsPreviewPayload
} from "@/lib/types"

interface DailyWordsModalProps {
  open: boolean
  dailyCatalog: DailyCatalogStatus | null
  onClose: () => void
  onClaimed: (payload: DailyClaimResponse) => void
}

export function DailyWordsModal({
  open,
  dailyCatalog,
  onClose,
  onClaimed
}: DailyWordsModalProps) {
  const prefersReducedMotion = useReducedMotion()
  const { showToast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState<DailyWordsPreviewPayload | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, open])

  useEffect(() => {
    if (!open) {
      setPreview(null)
      setSelectedIds([])
      setLoading(false)
      setSubmitting(false)
      return
    }

    let cancelled = false

    async function loadPreview() {
      setLoading(true)

      try {
        const response = await fetch("/api/cards/daily", {
          cache: "no-store"
        })

        if (!response.ok) {
          throw new Error("Could not load today's words.")
        }

        const payload = (await response.json()) as DailyWordsPreviewPayload

        if (cancelled) {
          return
        }

        setPreview(payload)
        setSelectedIds(payload.items.map((item) => item.id))
      } catch (error) {
        if (!cancelled) {
          showToast(
            error instanceof Error ? error.message : "Could not load today's words.",
            "error"
          )
          onClose()
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [onClose, open, showToast])

  const selectionLimit = preview?.remainingToday ?? dailyCatalog?.remainingToday ?? 0
  const selectedCount = selectedIds.length
  const canSubmit = selectedCount > 0 && !submitting && !loading
  const cefrLabel = dailyCatalog?.cefrLevel ?? preview?.items[0]?.cefrLevel ?? "A1"

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function toggleSelection(itemId: string) {
    setSelectedIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((value) => value !== itemId)
      }

      if (current.length >= selectionLimit) {
        showToast(`You can choose up to ${selectionLimit} words today.`, "error")
        return current
      }

      return [...current, itemId]
    })
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/cards/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          wordCatalogIds: selectedIds
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not add today's words.")
      }

      const payload = (await response.json()) as DailyClaimResponse
      onClaimed(payload)
      onClose()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not add today's words.",
        "error"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] bg-black/60 px-2 py-2 backdrop-blur-sm md:flex md:items-center md:justify-center md:px-4 md:py-4"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="translate-card mx-auto flex h-[min(86vh,700px)] w-full max-w-xl flex-col overflow-hidden rounded-[26px]"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-line px-4 py-3.5 md:px-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-bg-tertiary px-2.5 py-1 text-[10px] font-semibold text-muted border border-line">
                    <Sparkles size={12} />
                    Band {cefrLabel}
                  </div>
                  <h2 className="mt-2.5 text-[20px] font-bold tracking-[-0.04em] text-ink md:text-[22px]">
                    New words for today
                  </h2>
                  <p className="mt-1 text-[12px] text-muted md:text-[13px]">
                    {loading
                      ? "Loading today's set..."
                      : `Selected ${selectedCount} of ${selectionLimit || 0}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-bg-tertiary text-muted transition hover:bg-bg-secondary hover:text-ink border border-line"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4">
              {loading ? (
                <div className="space-y-2.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="skeleton h-20 rounded-[18px] border border-line bg-bg-tertiary"
                    />
                  ))}
                </div>
              ) : preview?.limitReached ? (
                <div className="translate-card rounded-[22px] p-5 text-center bg-bg-tertiary border border-line">
                  <p className="text-[18px] font-semibold text-ink">Today's limit is already completed.</p>
                  <p className="mt-2 text-[13px] text-muted">
                    Come back tomorrow for a fresh set of words.
                  </p>
                </div>
              ) : !preview?.items.length ? (
                <div className="translate-card rounded-[22px] p-5 text-center bg-bg-tertiary border border-line">
                  <p className="text-[18px] font-semibold text-ink">No words available right now.</p>
                  <p className="mt-2 text-[13px] text-muted">
                    We couldn't find new words for your current level yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {preview.items.map((item: DailyWordCandidate) => {
                    const selected = selectedSet.has(item.id)

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelection(item.id)}
                        className={`translate-card relative flex w-full items-center gap-3 rounded-[22px] px-3 pb-2 pt-3 text-left transition-all duration-200 border border-line bg-bg-tertiary ${
                          selected
                            ? "ring-1 ring-inset ring-ink/20 bg-bg-secondary"
                            : "hover:bg-bg-secondary"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            selected
                              ? "bg-ink text-bg-primary"
                              : "bg-bg-secondary text-transparent"
                          }`}
                        >
                          <Check size={16} strokeWidth={2.8} />
                        </div>
                        <div className="min-w-0 pr-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[24px] font-bold tracking-[-0.3px] text-ink">
                              {item.word}
                            </p>
                            <span className="inline-flex shrink-0 items-center rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-black uppercase tracking-tight text-muted border border-line">
                              {item.cefrLevel}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-3">
                            <p className="truncate text-[12px] font-medium leading-snug text-muted">
                              {item.translation}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-line px-3 py-3 md:px-4">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                className={`w-full rounded-full px-4 py-3 text-[15px] font-black transition ${
                  canSubmit
                    ? "bg-ink text-bg-primary hover:opacity-90"
                    : "cursor-not-allowed bg-bg-tertiary text-muted opacity-50"
                }`}
              >
                {submitting
                  ? "Adding words..."
                  : `Add ${selectedCount} word${selectedCount === 1 ? "" : "s"} to deck`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}

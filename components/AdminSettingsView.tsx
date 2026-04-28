"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GripVertical } from "lucide-react"

import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import type { AdminSettingsPayload, TranslationEngine } from "@/lib/types"

const DAILY_LIMIT_OPTIONS = [1, 3, 5, 10, 15, 20, 30, 50, 100]
const REVIEW_LIVES_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

const TRANSLATOR_LABELS: Record<TranslationEngine, string> = {
  catalog: "Catalog",
  deepl: "DeepL",
  langeek: "LanGeek"
}

const ALL_TRANSLATORS = Object.keys(TRANSLATOR_LABELS) as TranslationEngine[]
const SORTABLE_ITEM_HEIGHT = 60
const SORTABLE_GAP = 8
const SORTABLE_STEP = SORTABLE_ITEM_HEIGHT + SORTABLE_GAP

function getItemTop(index: number) {
  return index * SORTABLE_STEP
}

interface DragState {
  engine: TranslationEngine
  startY: number
  startTop: number
  currentIndex: number
}

export function AdminSettingsView() {
  const { showToast } = useToast()
  const [settingsLimit, setSettingsLimit] = useState("5")
  const [reviewLives, setReviewLives] = useState("3")
  const [translationPriority, setTranslationPriority] = useState<TranslationEngine[]>(["catalog", "deepl", "langeek"])
  const [draggedEngine, setDraggedEngine] = useState<TranslationEngine | null>(null)
  const [floatingTop, setFloatingTop] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const dragStateRef = useRef<DragState | null>(null)
  const { data, loading } = useClientResource<AdminSettingsPayload>({
    key: "admin:settings",
    loader: async () => {
      const response = await fetch("/api/admin/settings", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load settings.")
      }

      return (await response.json()) as AdminSettingsPayload
    },
    onError: () => {
      showToast("Could not load settings.", "error")
    }
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setSettingsLimit(String(data.settings.dailyNewCardsLimit))
    setReviewLives(String(data.settings.reviewLives))
    setTranslationPriority(data.settings.translationPriority)
  }, [data])

  const orderedTranslators = useMemo(() => {
    const disabled = ALL_TRANSLATORS.filter((engine) => !translationPriority.includes(engine))
    return [...translationPriority, ...disabled]
  }, [translationPriority])

  function toggleTranslator(engine: TranslationEngine, enabled: boolean) {
    setTranslationPriority((current) => {
      if (enabled) {
        if (current.includes(engine)) {
          return current
        }

        return [...current, engine]
      }

      if (current.length === 1) {
        return current
      }

      return current.filter((item) => item !== engine)
    })
  }

  function reorderTranslators(
    current: TranslationEngine[],
    dragged: TranslationEngine,
    nextIndex: number
  ) {
    const currentIndex = current.indexOf(dragged)

    if (currentIndex === -1 || currentIndex === nextIndex) {
      return current
    }

    const next = [...current]
    next.splice(currentIndex, 1)
    next.splice(nextIndex, 0, dragged)
    return next
  }

  function handlePointerMove(event: PointerEvent) {
    const drag = dragStateRef.current

    if (!drag) {
      return
    }

    event.preventDefault()

    const maxTop = getItemTop(Math.max(translationPriority.length - 1, 0))
    const rawTop = drag.startTop + (event.clientY - drag.startY)
    const clampedTop = Math.max(0, Math.min(rawTop, maxTop))
    const nextIndex = Math.min(
      Math.max(Math.round(clampedTop / SORTABLE_STEP), 0),
      Math.max(translationPriority.length - 1, 0)
    )

    setFloatingTop(clampedTop)

    if (nextIndex !== drag.currentIndex) {
      setTranslationPriority((current) => reorderTranslators(current, drag.engine, nextIndex))
      dragStateRef.current = {
        ...drag,
        currentIndex: nextIndex
      }
    }
  }

  function handlePointerUp() {
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    dragStateRef.current = null
    setDraggedEngine(null)
    setFloatingTop(null)
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [])

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>, engine: TranslationEngine) {
    if (!translationPriority.includes(engine)) {
      return
    }

    event.preventDefault()

    const currentIndex = translationPriority.indexOf(engine)
    const nextDragState: DragState = {
      engine,
      startY: event.clientY,
      startTop: getItemTop(currentIndex),
      currentIndex
    }

    dragStateRef.current = nextDragState
    setDraggedEngine(engine)
    setFloatingTop(nextDragState.startTop)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  async function handleSave() {
    setSaving(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dailyNewCardsLimit: Number(settingsLimit),
          reviewLives: Number(reviewLives),
          translationPriority
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not save settings.")
      }

      const payload = (await response.json()) as AdminSettingsPayload
      setSettingsLimit(String(payload.settings.dailyNewCardsLimit))
      setReviewLives(String(payload.settings.reviewLives))
      setTranslationPriority(payload.settings.translationPriority)
      showToast("Settings updated.", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not save settings.",
        "error"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) {
    return <div className="skeleton h-[28rem] rounded-[2rem]" />
  }

  return (
    <div className="space-y-5">
      <section className="panel-admin rounded-[2rem] p-5">
        <p className="section-label">Site settings</p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.5px] text-ink">
          Configure global app behavior
        </h1>
        <p className="mt-2 text-sm text-muted">
          These settings affect translation flow and daily card limits across the app.
        </p>
      </section>

      <section className="panel-admin rounded-[2rem] p-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-separator bg-bg-secondary">
          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="font-semibold text-ink">Daily card limit</p>
              <p className="text-sm text-muted">How many new words a learner can claim per day.</p>
            </div>
            <select
              value={settingsLimit}
              onChange={(event) => setSettingsLimit(event.target.value)}
              className="input-field w-28"
            >
              {DAILY_LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="font-semibold text-ink">Hearts per session</p>
              <p className="text-sm text-muted">How many mistakes a learner can make in review.</p>
            </div>
            <select
              value={reviewLives}
              onChange={(event) => setReviewLives(event.target.value)}
              className="input-field w-24"
            >
              {REVIEW_LIVES_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-separator px-5 py-4">
            <div className="mb-3">
              <p className="font-semibold text-ink">Translator priority</p>
              <p className="text-sm text-muted">Drag to reorder priority. Uncheck to disable any source.</p>
            </div>
            <div
              className="relative"
              style={{
                height: `${orderedTranslators.length * SORTABLE_STEP - SORTABLE_GAP}px`
              }}
            >
              {orderedTranslators.map((engine, index) => {
                const enabled = translationPriority.includes(engine)
                const resolvedIndex = orderedTranslators.indexOf(engine)
                const top =
                  draggedEngine === engine && floatingTop !== null
                    ? floatingTop
                    : getItemTop(resolvedIndex)

                return (
                  <div
                    key={engine}
                    className={`absolute left-0 right-0 flex items-center justify-between rounded-xl border px-4 py-3 ${
                      draggedEngine === engine
                        ? "z-10 border-white/25 bg-bg-primary shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                        : enabled
                          ? "border-separator bg-bg-primary"
                          : "border-separator bg-bg-primary/45 opacity-70"
                    }`}
                    style={{
                      top,
                      height: `${SORTABLE_ITEM_HEIGHT}px`,
                      transition:
                        draggedEngine === engine
                          ? "box-shadow 150ms ease, background 150ms ease, border-color 150ms ease"
                          : "top 200ms ease, box-shadow 150ms ease, background 150ms ease, border-color 150ms ease"
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) => toggleTranslator(engine, event.target.checked)}
                        className="h-4 w-4"
                      />
                      <p className="font-medium text-ink">{TRANSLATOR_LABELS[engine]}</p>
                    </div>
                    <button
                      type="button"
                      onPointerDown={(event) => handlePointerDown(event, engine)}
                      className={`flex h-11 w-11 touch-none cursor-grab items-center justify-center rounded-xl active:cursor-grabbing ${
                        enabled ? "bg-white/[0.05] text-white/55" : "bg-white/[0.03] text-white/20"
                      }`}
                      disabled={!enabled}
                      aria-label={`Reorder ${TRANSLATOR_LABELS[engine]}`}
                    >
                      <GripVertical size={22} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="button-primary whitespace-nowrap"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </section>
    </div>
  )
}

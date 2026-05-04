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

const NAV_LABELS: Record<string, string> = {
  home: "Home",
  cards: "Cards",
  translate: "Translate",
  practice: "Practice",
  grammar: "Grammar",
  ai: "AI"
}

const ALL_NAV_ITEMS = Object.keys(NAV_LABELS)
const ALL_TRANSLATORS = Object.keys(TRANSLATOR_LABELS) as TranslationEngine[]
const SORTABLE_ITEM_HEIGHT = 60
const SORTABLE_GAP = 8
const SORTABLE_STEP = SORTABLE_ITEM_HEIGHT + SORTABLE_GAP

const NAV_ITEM_WIDTH = 120
const NAV_GAP = 12
const NAV_STEP = NAV_ITEM_WIDTH + NAV_GAP

function getNavLeft(index: number) {
  return index * NAV_STEP
}

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
  const [cefrProfilerEnabled, setCefrProfilerEnabled] = useState("enabled")
  const [translationPriority, setTranslationPriority] = useState<TranslationEngine[]>(["catalog", "deepl", "langeek"])
  const [draggedEngine, setDraggedEngine] = useState<TranslationEngine | null>(null)
  const [floatingTop, setFloatingTop] = useState<number | null>(null)
  const [grammarCorrectPoints, setGrammarCorrectPoints] = useState("5")
  const [grammarPenaltyLow, setGrammarPenaltyLow] = useState("-4")
  const [grammarPenaltyMedium, setGrammarPenaltyMedium] = useState("-8")
  const [grammarPenaltyHigh, setGrammarPenaltyHigh] = useState("-12")
  const [mobileNavOrder, setMobileNavOrder] = useState<string[]>(["home", "cards", "translate", "practice", "grammar", "ai"])
  const [draggedNavItem, setDraggedNavItem] = useState<string | null>(null)
  const [floatingLeft, setFloatingLeft] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dragStateRef = useRef<DragState | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])
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
    setCefrProfilerEnabled(data.settings.cefrProfilerEnabled ? "enabled" : "disabled")
    setTranslationPriority(data.settings.translationPriority)
    setGrammarCorrectPoints(String(data.settings.grammarCorrectPoints ?? 5))
    setGrammarPenaltyLow(String(data.settings.grammarPenaltyLow ?? -4))
    setGrammarPenaltyMedium(String(data.settings.grammarPenaltyMedium ?? -8))
    setGrammarPenaltyHigh(String(data.settings.grammarPenaltyHigh ?? -12))
    setMobileNavOrder(data.settings.mobileNavOrder ?? ["home", "cards", "translate", "practice", "grammar", "ai"])
  }, [data])

  if (!mounted || loading) {
    return null
  }

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

  const orderedNavItems = useMemo(() => {
    const disabled = ALL_NAV_ITEMS.filter((item) => !mobileNavOrder.includes(item))
    return [...mobileNavOrder, ...disabled]
  }, [mobileNavOrder])

  function toggleNavItem(item: string, enabled: boolean) {
    setMobileNavOrder((current) => {
      if (enabled) {
        if (current.includes(item)) {
          return current
        }
        return [...current, item]
      }
      if (current.length === 1) {
        return current
      }
      return current.filter((i) => i !== item)
    })
  }

  function handleNavDragStart(item: string, clientX: number) {
    const index = mobileNavOrder.indexOf(item)
    if (index === -1) return

    setDraggedNavItem(item)
    const initialLeft = getNavLeft(index)
    setFloatingLeft(initialLeft)

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - clientX
      const newLeft = initialLeft + deltaX
      setFloatingLeft(newLeft)

      const newIndex = Math.max(
        0,
        Math.min(mobileNavOrder.length - 1, Math.round(newLeft / NAV_STEP))
      )

      if (newIndex !== index) {
        setMobileNavOrder((current) => {
          const next = [...current]
          const [removed] = next.splice(index, 1)
          next.splice(newIndex, 0, removed)
          return next
        })
        // Update initialX/initialLeft to follow the item
        clientX = e.clientX - (newLeft - getNavLeft(newIndex))
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      setDraggedNavItem(null)
      setFloatingLeft(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
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
          cefrProfilerEnabled: cefrProfilerEnabled === "enabled",
          translationPriority,
          grammarCorrectPoints: Number(grammarCorrectPoints),
          grammarPenaltyLow: Number(grammarPenaltyLow),
          grammarPenaltyMedium: Number(grammarPenaltyMedium),
          grammarPenaltyHigh: Number(grammarPenaltyHigh),
          mobileNavOrder
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not save settings.")
      }

      const payload = (await response.json()) as AdminSettingsPayload
      setSettingsLimit(String(payload.settings.dailyNewCardsLimit))
      setReviewLives(String(payload.settings.reviewLives))
      setCefrProfilerEnabled(payload.settings.cefrProfilerEnabled ? "enabled" : "disabled")
      setTranslationPriority(payload.settings.translationPriority)
      setGrammarCorrectPoints(String(payload.settings.grammarCorrectPoints ?? 5))
      setGrammarPenaltyLow(String(payload.settings.grammarPenaltyLow ?? -4))
      setGrammarPenaltyMedium(String(payload.settings.grammarPenaltyMedium ?? -8))
      setGrammarPenaltyHigh(String(payload.settings.grammarPenaltyHigh ?? -12))
      setMobileNavOrder(payload.settings.mobileNavOrder ?? ["home", "cards", "translate", "practice", "grammar", "ai"])
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

          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="font-semibold text-ink">CEFR text profiler</p>
              <p className="text-sm text-muted">Show A1-C2 and Off-list breakdown in Translate.</p>
            </div>
            <select
              value={cefrProfilerEnabled}
              onChange={(event) => setCefrProfilerEnabled(event.target.value)}
              className="input-field w-32"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="px-6 py-6 border-t border-white/[0.05]">
            <div className="mb-6">
              <p className="text-[13px] font-bold uppercase tracking-wider text-white/20">Translator priority</p>
              <h3 className="mt-2 text-[20px] font-black text-white">Reorder engines</h3>
              <p className="mt-1 text-[15px] font-medium text-white/40">Drag to change priority. Uncheck to disable.</p>
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
                    className={`absolute left-0 right-0 flex items-center justify-between rounded-2xl border px-5 ${
                      draggedEngine === engine
                        ? "z-10 border-white/20 bg-white/[0.06] shadow-2xl scale-[1.01]"
                        : enabled
                          ? "border-white/[0.03] bg-white/[0.01]"
                          : "border-white/[0.02] bg-white/[0.005] opacity-50"
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
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) => toggleTranslator(engine, event.target.checked)}
                        className="h-5 w-5 rounded-md border-white/10 bg-white/5 accent-white"
                      />
                      <p className="text-[16px] font-bold text-white">{TRANSLATOR_LABELS[engine]}</p>
                    </div>
                    <button
                      type="button"
                      onPointerDown={(event) => handlePointerDown(event, engine)}
                      className={`flex h-12 w-12 touch-none cursor-grab items-center justify-center rounded-xl active:cursor-grabbing transition-colors ${
                        enabled ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-white/[0.02] text-white/10"
                      }`}
                      disabled={!enabled}
                    >
                      <GripVertical size={20} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end opacity-20 pointer-events-none">
          <p className="text-[12px] font-bold text-white uppercase tracking-widest">Scroll down to save all</p>
        </div>
      </section>

      <section className="panel-admin rounded-[2rem] p-5">
        <p className="section-label">Grammar Hub Scoring</p>
        <h2 className="mt-2 text-[22px] font-bold tracking-[-0.5px] text-ink">
          Balance learning difficulty
        </h2>
        <p className="mt-2 text-sm text-muted">
          Adjust how many points are awarded or deducted for different outcomes.
        </p>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-separator bg-bg-secondary">
          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="font-semibold text-white">Correct answer award</p>
              <p className="text-sm text-muted">Points added for each correctly identified rule.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-400">+</span>
              <input
                type="number"
                value={grammarCorrectPoints}
                onChange={(e) => setGrammarCorrectPoints(e.target.value)}
                className="h-10 w-24 rounded-xl border border-white/10 bg-white/5 px-3 text-center font-black text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="font-semibold text-white">Minor mistake penalty</p>
              <p className="text-sm text-muted">Low severity errors (typos, small slips).</p>
            </div>
            <input
              type="number"
              value={grammarPenaltyLow}
              onChange={(e) => setGrammarPenaltyLow(e.target.value)}
              className="h-10 w-24 rounded-xl border border-white/10 bg-white/5 px-3 text-center font-black text-rose-400 outline-none focus:border-rose-500/50 transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="font-semibold text-white">Moderate mistake penalty</p>
              <p className="text-sm text-muted">Medium severity grammar errors.</p>
            </div>
            <input
              type="number"
              value={grammarPenaltyMedium}
              onChange={(e) => setGrammarPenaltyMedium(e.target.value)}
              className="h-10 w-24 rounded-xl border border-white/10 bg-white/5 px-3 text-center font-black text-rose-400 outline-none focus:border-rose-500/50 transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-white">Critical mistake penalty</p>
              <p className="text-sm text-muted">High severity systematic errors.</p>
            </div>
            <input
              type="number"
              value={grammarPenaltyHigh}
              onChange={(e) => setGrammarPenaltyHigh(e.target.value)}
              className="h-10 w-24 rounded-xl border border-white/10 bg-white/5 px-3 text-center font-black text-rose-500 outline-none focus:border-rose-600/50 transition-all"
            />
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-black text-white">Bottom bar priority</h2>
        <p className="mt-1 text-sm text-muted">
          Drag to reorder horizontal navigation. Uncheck to disable.
        </p>

        <div className="mt-8 relative h-32 w-full overflow-x-auto hide-scrollbar">
          <div 
            className="relative h-24"
            style={{ width: getNavLeft(orderedNavItems.length) }}
          >
            {orderedNavItems.map((item) => {
              const isEnabled = mobileNavOrder.includes(item)
              const index = mobileNavOrder.indexOf(item)
              const left = draggedNavItem === item && floatingLeft !== null
                ? floatingLeft
                : getNavLeft(index !== -1 ? index : orderedNavItems.indexOf(item))

              return (
                <div
                  key={item}
                  style={{
                    position: "absolute",
                    left,
                    top: 0,
                    width: NAV_ITEM_WIDTH,
                    zIndex: draggedNavItem === item ? 10 : 1,
                    transition: draggedNavItem === item ? "none" : "left 0.25s cubic-bezier(0.2, 0, 0, 1)"
                  }}
                  className={`flex h-24 flex-col items-center justify-center gap-3 rounded-2xl border transition-all ${
                    draggedNavItem === item 
                      ? "border-white/40 bg-white/[0.12] shadow-2xl scale-[1.05]" 
                      : isEnabled 
                        ? "border-white/[0.05] bg-white/[0.02]" 
                        : "border-white/[0.02] bg-white/[0.005] opacity-30"
                  }`}
                >
                  <div className="flex w-full items-center justify-between px-3">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => toggleNavItem(item, e.target.checked)}
                      className="h-5 w-5 rounded-md border-white/10 bg-white/5 accent-white"
                    />
                    <div
                      onMouseDown={(e) => isEnabled && handleNavDragStart(item, e.clientX)}
                      className={`cursor-grab active:cursor-grabbing p-2 text-white/20 transition-colors hover:text-white ${!isEnabled ? "invisible" : ""}`}
                    >
                      <GripVertical size={18} />
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-white px-2 truncate w-full text-center">
                    {NAV_LABELS[item]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-end pb-20">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="h-16 px-12 bg-white text-black rounded-full font-black text-[17px] tracking-tight shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? "SAVING..." : "SAVE SETTINGS"}
          </button>
        </div>
      </section>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

export interface QuizMatchItem {
  id: string
  sourceCardId: string
  text: string
  cefrLevel?: string | null
}

interface QuizCardProps {
  leftItems: QuizMatchItem[]
  rightItems: QuizMatchItem[]
  batchIndex: number
  totalBatches: number
  onLifeLost: () => void
  onBatchCompleted: () => void
  onProgressChange: (count: number) => void
}

export function QuizCard({
  leftItems,
  rightItems,
  batchIndex,
  totalBatches,
  onLifeLost,
  onBatchCompleted,
  onProgressChange
}: QuizCardProps) {
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null)
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null)
  const [solvedLeftIds, setSolvedLeftIds] = useState<string[]>([])
  const [solvedRightIds, setSolvedRightIds] = useState<string[]>([])
  const [rejectedIds, setRejectedIds] = useState<string[]>([])
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    setSelectedLeftId(null)
    setSelectedRightId(null)
    setSolvedLeftIds([])
    setSolvedRightIds([])
    setRejectedIds([])
    setResolving(false)
    onProgressChange(0)
  }, [leftItems, onProgressChange, rightItems])

  function handleResolvedPair(nextSolvedCount: number) {
    onProgressChange(nextSolvedCount)

    if (nextSolvedCount === leftItems.length) {
      window.setTimeout(() => {
        onBatchCompleted()
      }, 220)
    }
  }

  function resolveSelection(nextLeftId: string, nextRightId: string) {
    const leftItem = leftItems.find((item) => item.id === nextLeftId)
    const rightItem = rightItems.find((item) => item.id === nextRightId)

    if (!leftItem || !rightItem) {
      return
    }

    if (leftItem.sourceCardId === rightItem.sourceCardId) {
      const nextSolvedCount = solvedLeftIds.length + 1
      setSolvedLeftIds((current) => [...current, nextLeftId])
      setSolvedRightIds((current) => [...current, nextRightId])
      setSelectedLeftId(null)
      setSelectedRightId(null)
      handleResolvedPair(nextSolvedCount)
      return
    }

    setResolving(true)
    setRejectedIds([nextLeftId, nextRightId])

    window.setTimeout(() => {
      setResolving(false)
      setRejectedIds([])
      setSelectedLeftId(null)
      setSelectedRightId(null)
      onLifeLost()
    }, 420)
  }

  function handleSelectLeft(id: string) {
    if (resolving || solvedLeftIds.includes(id)) {
      return
    }

    if (selectedRightId) {
      setSelectedLeftId(id)
      resolveSelection(id, selectedRightId)
      return
    }

    setSelectedLeftId((current) => (current === id ? null : id))
  }

  function handleSelectRight(id: string) {
    if (resolving || solvedRightIds.includes(id)) {
      return
    }

    if (selectedLeftId) {
      setSelectedRightId(id)
      resolveSelection(selectedLeftId, id)
      return
    }

    setSelectedRightId((current) => (current === id ? null : id))
  }

  function getItemClassName(itemId: string, side: "left" | "right") {
    const solvedIds = side === "left" ? solvedLeftIds : solvedRightIds
    const selectedId = side === "left" ? selectedLeftId : selectedRightId

    if (solvedIds.includes(itemId)) {
      return "border-successText bg-successBg text-successText"
    }

    if (rejectedIds.includes(itemId)) {
      return "border-dangerText bg-dangerBg text-dangerText"
    }

    if (selectedId === itemId) {
      return "border-accent bg-accent/15 text-text-primary"
    }

    return "border-separator bg-bg-primary text-text-primary hover:border-accent"
  }

  return (
    <div className="panel p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[15px] text-text-secondary">Match Russian to English</p>
          <p className="mt-2 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
            Build all 4 pairs
          </p>
        </div>
        <p className="text-sm text-text-tertiary">
          Batch {batchIndex + 1} of {totalBatches}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 md:gap-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-quiet">Russian</p>
          {leftItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectLeft(item.id)}
              disabled={resolving || solvedLeftIds.includes(item.id)}
              className={`min-h-[68px] w-full rounded-[1.25rem] border px-3 py-3 text-center text-sm font-medium leading-5 transition md:min-h-[72px] md:rounded-[1.5rem] md:px-4 md:py-4 ${getItemClassName(item.id, "left")}`}
            >
              {item.text}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-quiet">English</p>
          {rightItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectRight(item.id)}
              disabled={resolving || solvedRightIds.includes(item.id)}
              className={`min-h-[68px] w-full rounded-[1.25rem] border px-3 py-3 text-center text-sm font-medium leading-5 transition md:min-h-[72px] md:rounded-[1.5rem] md:px-4 md:py-4 ${getItemClassName(item.id, "right")}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span>{item.text}</span>
                {item.cefrLevel ? (
                  <span className="text-[10px] font-normal opacity-75">
                    {item.cefrLevel}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

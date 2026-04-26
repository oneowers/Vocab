"use client"

import { useEffect, useState } from "react"

import { CSSBarChart } from "@/components/CSSBarChart"
import { useToast } from "@/components/Toast"
import { formatDateLabel, getTodayDateKey, listRecentDateKeys, listUpcomingDateKeys } from "@/lib/date"
import { getGuestCards, getGuestReviewLogs, isGuestSessionActive } from "@/lib/guest"
import type { CardRecord, ChartPoint, GuestReviewLog, StatsPayload } from "@/lib/types"

function computeLongestStreak(logs: GuestReviewLog[]) {
  const uniqueDays = Array.from(new Set(logs.map((log) => log.createdAt.slice(0, 10)))).sort()

  if (!uniqueDays.length) {
    return 0
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(`${uniqueDays[index - 1]}T00:00:00.000Z`)
    const next = new Date(`${uniqueDays[index]}T00:00:00.000Z`)
    const diff = (next.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000)

    if (diff === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

function computeCurrentStreak(logs: GuestReviewLog[]) {
  const uniqueDays = Array.from(new Set(logs.map((log) => log.createdAt.slice(0, 10)))).sort()

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

function countByDate(items: string[], dates: string[]): ChartPoint[] {
  return dates.map((date) => ({
    date,
    label: formatDateLabel(date),
    value: items.filter((item) => item === date).length
  }))
}

function computeGuestStats(cards: CardRecord[], logs: GuestReviewLog[]): StatsPayload {
  const reviewDates = logs.map((log) => log.createdAt.slice(0, 10))
  const cardDates = cards.map((card) => card.dateAdded.slice(0, 10))
  const today = getTodayDateKey()
  const totalCorrect = cards.reduce((sum, card) => sum + card.correctCount, 0)
  const totalWrong = cards.reduce((sum, card) => sum + card.wrongCount, 0)
  const total = totalCorrect + totalWrong
  const tags = cards.reduce<Record<string, number>>((accumulator, card) => {
    card.tags.forEach((tag) => {
      accumulator[tag] = (accumulator[tag] ?? 0) + 1
    })
    return accumulator
  }, {})

  return {
    currentStreak: computeCurrentStreak(logs),
    longestStreak: computeLongestStreak(logs),
    accuracyRate: total ? Math.round((totalCorrect / total) * 100) : 0,
    cardsAdded: countByDate(cardDates, listRecentDateKeys(30, today)),
    reviewsPerDay: countByDate(reviewDates, listRecentDateKeys(30, today)),
    hardestCards: [...cards].sort((left, right) => right.wrongCount - left.wrongCount).slice(0, 5),
    dueByDay: listUpcomingDateKeys(7, today).map((date) => ({
      date,
      label: formatDateLabel(date),
      value: cards.filter((card) => card.nextReviewDate === date).length
    })),
    tagBreakdown: Object.entries(tags).map(([tag, count]) => ({ tag, count }))
  }
}

export function StatsView() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsPayload | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadStats() {
      const guestMode = isGuestSessionActive()

      if (guestMode) {
        setStats(computeGuestStats(getGuestCards(), getGuestReviewLogs()))
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/stats", {
          cache: "no-store"
        })

        if (!response.ok) {
          throw new Error("Could not load stats.")
        }

        setStats((await response.json()) as StatsPayload)
      } catch {
        showToast("Could not load your stats.", "error")
      } finally {
        setLoading(false)
      }
    }

    void loadStats()
  }, [showToast])

  if (loading || !stats) {
    return <div className="skeleton h-[40rem] rounded-[2rem]" />
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <CSSBarChart
          title="Current streak"
          points={[{ date: "current-streak", label: "Now", value: stats.currentStreak }]}
          tone="gold"
          heightClassName="h-28"
          summaryLabel="days"
        />
        <CSSBarChart
          title="Longest streak"
          points={[{ date: "longest-streak", label: "Best", value: stats.longestStreak }]}
          tone="ink"
          heightClassName="h-28"
          summaryLabel="days"
        />
        <CSSBarChart
          title="Accuracy"
          points={[{ date: "accuracy", label: "Rate", value: stats.accuracyRate }]}
          tone="green"
          heightClassName="h-28"
          summaryLabel="accuracy"
          valueSuffix="%"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <CSSBarChart
          title="Cards added per day"
          points={stats.cardsAdded}
          tone="gold"
          periodLabel="Last 30 days"
        />
        <CSSBarChart
          title="Reviews per day"
          points={stats.reviewsPerDay}
          tone="ink"
          periodLabel="Last 30 days"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <CSSBarChart
          title="Cards due over the next 7 days"
          points={stats.dueByDay}
          tone="green"
          periodLabel="Next 7 days"
        />
        <CSSBarChart
          title="Top 5 hardest cards"
          points={
            stats.hardestCards.length
              ? stats.hardestCards.map((card) => ({
                  date: card.id,
                  label: card.original,
                  value: card.wrongCount
                }))
              : [{ date: "none", label: "None", value: 0 }]
          }
          tone="rose"
          periodLabel="Wrong answers"
        />
      </div>

      <CSSBarChart
        title="Breakdown by tag"
        points={
          stats.tagBreakdown.length
            ? stats.tagBreakdown.map((item) => ({
                date: item.tag,
                label: item.tag,
                value: item.count
              }))
            : [{ date: "none", label: "None", value: 0 }]
        }
        tone="ink"
        periodLabel="Cards per tag"
      />
    </div>
  )
}

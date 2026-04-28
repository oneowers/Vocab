"use client"

import { CSSBarChart } from "@/components/CSSBarChart"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
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

  return {
    currentStreak: computeCurrentStreak(logs),
    longestStreak: computeLongestStreak(logs),
    accuracyRate: total ? Math.round((totalCorrect / total) * 100) : 0,
    cardsAdded: countByDate(cardDates, listRecentDateKeys(7, today)),
    reviewsPerDay: countByDate(reviewDates, listRecentDateKeys(7, today)),
    hardestCards: [...cards].sort((left, right) => right.wrongCount - left.wrongCount).slice(0, 5),
    dueByDay: listUpcomingDateKeys(7, today).map((date) => ({
      date,
      label: formatDateLabel(date),
      value: cards.filter((card) => card.nextReviewDate === date).length
    }))
  }
}

export function StatsView() {
  const { showToast } = useToast()
  const guestMode = isGuestSessionActive()
  const guestStats = guestMode ? computeGuestStats(getGuestCards(), getGuestReviewLogs()) : null
  const { data: stats, loading } = useClientResource<StatsPayload>({
    key: guestMode ? "stats:guest" : "stats:user",
    initialData: guestStats,
    loader: async () => {
      const response = await fetch("/api/stats", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load stats.")
      }

      return (await response.json()) as StatsPayload
    },
    onError: () => {
      showToast("Could not load your stats.", "error")
    }
  })

  if (loading || !stats) {
    return <div className="skeleton h-[40rem] rounded-[2rem]" />
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-3">
        <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
            Current streak
          </p>
          <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
            {stats.currentStreak}
          </p>
        </article>
        <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
            Longest streak
          </p>
          <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
            {stats.longestStreak}
          </p>
        </article>
        <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
            Accuracy
          </p>
          <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
            {stats.accuracyRate}%
          </p>
        </article>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <CSSBarChart
          title="Cards added per day"
          points={stats.cardsAdded}
          tone="gold"
          periodLabel="Last 7 days"
        />
        <CSSBarChart
          title="Reviews per day"
          points={stats.reviewsPerDay}
          tone="ink"
          periodLabel="Last 7 days"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <CSSBarChart
          title="Cards due over the next 7 days"
          points={stats.dueByDay}
          tone="green"
          periodLabel="Next 7 days"
        />
        <section className="panel rounded-[2rem] p-5">
          <h2 className="text-lg font-semibold text-ink">Top 5 hardest cards</h2>
          <div className="mt-5 space-y-3">
            {stats.hardestCards.length ? (
              stats.hardestCards.map((card) => (
                <div key={card.id} className="rounded-[1.5rem] bg-white/[0.05] px-4 py-4">
                  <p className="font-semibold text-ink">
                    {card.original} <span className="font-normal text-muted">→ {card.translation}</span>
                  </p>
                  <p className="mt-1 text-sm text-quiet">Wrong answers: {card.wrongCount}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No difficult cards yet. Nice work.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

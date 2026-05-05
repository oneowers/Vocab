import {
  addDaysToDateKey,
  formatDateLabel,
  getTodayDateKey,
  listRecentDateKeys,
  parseDateKey
} from "@/lib/date"
import type { ProfileActivityDay, ProfileActivityMonthLabel, ProfileActivityPayload } from "@/lib/types"

function startOfWeekSunday(date: Date) {
  const next = new Date(date)
  next.setUTCHours(0, 0, 0, 0)
  next.setUTCDate(next.getUTCDate() - next.getUTCDay())
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildActivityGrid(endDateKey = getTodayDateKey()) {
  const today = parseDateKey(endDateKey)
  const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1))
  const gridStart = startOfWeekSunday(yearStart)
  const totalDays =
    Math.floor((today.getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
  const yearStartKey = toDateKey(yearStart)

  const days = Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(gridStart, index)
    return {
      date: toDateKey(date),
      weekIndex: Math.floor(index / 7),
      inCurrentYear: toDateKey(date) >= yearStartKey && toDateKey(date) <= endDateKey
    }
  })

  const months = days.reduce<ProfileActivityMonthLabel[]>((accumulator, day, index) => {
    if (!day.inCurrentYear) {
      return accumulator
    }

    const date = parseDateKey(day.date)
    const label = date.toLocaleDateString("en-US", { month: "short" })
    const previous = index > 0 ? days[index - 1] : null
    const previousMonth = previous
      ? previous.inCurrentYear
        ? parseDateKey(previous.date).getUTCMonth()
        : null
      : null

    if (index === 0 || date.getUTCMonth() !== previousMonth) {
      accumulator.push({
        label,
        weekIndex: day.weekIndex
      })
    }

    return accumulator
  }, [])

  return { days, months }
}

export function buildEmptyProfileActivity(endDateKey = getTodayDateKey()): ProfileActivityPayload {
  const activityGrid = buildActivityGrid(endDateKey)

  return {
    activeDaysLastYear: 0,
    totalReviewsLastYear: 0,
    days: activityGrid.days.map((day) => ({
      date: day.date,
      count: 0,
      level: 0
    })),
    months: activityGrid.months
  }
}

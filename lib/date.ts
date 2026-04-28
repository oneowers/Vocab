const DAY_MS = 24 * 60 * 60 * 1000

export function getTodayDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`)
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const next = parseDateKey(dateKey)
  next.setUTCDate(next.getUTCDate() + days)
  return getTodayDateKey(next)
}

export function getYesterdayDateKey(dateKey = getTodayDateKey()) {
  return addDaysToDateKey(dateKey, -1)
}

export function compareDateKeys(left: string, right: string) {
  if (left === right) {
    return 0
  }

  return left < right ? -1 : 1
}

export function isDueDate(dateKey: string, today = getTodayDateKey()) {
  return compareDateKeys(dateKey, today) <= 0
}

export function listRecentDateKeys(days: number, end = getTodayDateKey()) {
  return Array.from({ length: days }, (_, index) =>
    addDaysToDateKey(end, index - (days - 1))
  )
}

export function listUpcomingDateKeys(days: number, start = getTodayDateKey()) {
  return Array.from({ length: days }, (_, index) => addDaysToDateKey(start, index))
}

export function formatDateLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })
}

export function formatTimestamp(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "2-digit" : undefined,
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function groupByDate(items: string[]) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item] = (accumulator[item] ?? 0) + 1
    return accumulator
  }, {})
}

export function diffInCalendarDays(previous: string, next: string) {
  return Math.round(
    (parseDateKey(next).getTime() - parseDateKey(previous).getTime()) / DAY_MS
  )
}


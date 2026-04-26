import { addDaysToDateKey, getTodayDateKey } from "@/lib/date"
import type { CardRecord, ReviewResult } from "@/lib/types"

export function getReviewOutcome(result: ReviewResult, today = getTodayDateKey()) {
  return {
    nextReviewDate:
      result === "known"
        ? addDaysToDateKey(today, 15)
        : addDaysToDateKey(today, 1),
    reviewCountDelta: result === "known" ? 1 : 0,
    correctCountDelta: result === "known" ? 1 : 0,
    wrongCountDelta: result === "unknown" ? 1 : 0
  }
}

export function isMastered(reviewCount: number) {
  return reviewCount >= 3
}

export function sortDueCards(cards: CardRecord[]) {
  return [...cards].sort((left, right) =>
    left.nextReviewDate.localeCompare(right.nextReviewDate)
  )
}


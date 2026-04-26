import { addDaysToDateKey, getTodayDateKey } from "@/lib/date"
import type { CardRecord, CardStatusFilter, ReviewResult } from "@/lib/types"

export function getReviewOutcome(result: ReviewResult, today = getTodayDateKey()) {
  return {
    nextReviewDate:
      result === "known"
        ? addDaysToDateKey(today, 2)
        : today,
    reviewCountDelta: result === "known" ? 1 : 0,
    correctCountDelta: result === "known" ? 1 : 0,
    wrongCountDelta: result === "unknown" ? 1 : 0,
    lastReviewResult: result
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

export function matchesCardStatus(card: CardRecord, status: CardStatusFilter) {
  if (status === "All") {
    return true
  }

  return card.lastReviewResult === status
}

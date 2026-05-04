import type { CardRecord } from "./cards"

export interface ChartPoint {
  date: string
  label: string
  value: number
}

export interface StatsPayload {
  currentStreak: number
  longestStreak: number
  accuracyRate: number
  cardsAdded: ChartPoint[]
  reviewsPerDay: ChartPoint[]
  hardestCards: CardRecord[]
  dueByDay: ChartPoint[]
}

export interface DetailedStatsPayload {
  summary: {
    totalCardsLearned: number
    currentStreak: number
    activeDays: number
  }
  weeklyProgress: ChartPoint[]
  cardsByCefrLevel: Record<import("./common").CefrLevel, number>
  recentMistakes: Array<{
    id: string
    cardId: string
    word: string
    createdAt: string
  }>
}

export interface ProfileActivityDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface ProfileActivityMonthLabel {
  label: string
  weekIndex: number
}

export interface ProfileActivityPayload {
  activeDaysLastYear: number
  totalReviewsLastYear: number
  days: ProfileActivityDay[]
  months: ProfileActivityMonthLabel[]
}

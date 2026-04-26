"use client"

import { getTodayDateKey } from "@/lib/date"
import { getReviewOutcome } from "@/lib/spaced-repetition"
import type { CardRecord, GuestReviewLog, ReviewResult } from "@/lib/types"

const GUEST_MODE_KEY = "wordflow.guest-mode"
const GUEST_CARDS_KEY = "wordflow.guest-cards"
const GUEST_REVIEW_LOGS_KEY = "wordflow.guest-review-logs"

function createSampleCards(): CardRecord[] {
  const today = getTodayDateKey()

  return [
    {
      id: "guest-1",
      userId: "guest-user",
      original: "apple",
      translation: "яблоко",
      direction: "en-ru",
      example: "She packed an apple for the trip.",
      phonetic: "/ˈæp.əl/",
      dateAdded: new Date().toISOString(),
      nextReviewDate: today,
      lastReviewResult: "unknown",
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0
    },
    {
      id: "guest-2",
      userId: "guest-user",
      original: "river",
      translation: "река",
      direction: "en-ru",
      example: "The river is calm in the morning.",
      phonetic: "/ˈrɪv.ər/",
      dateAdded: new Date().toISOString(),
      nextReviewDate: today,
      lastReviewResult: "unknown",
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0
    },
    {
      id: "guest-3",
      userId: "guest-user",
      original: "учиться",
      translation: "to study",
      direction: "ru-en",
      example: "I want to study every day.",
      phonetic: "/ˈstʌd.i/",
      dateAdded: new Date().toISOString(),
      nextReviewDate: today,
      lastReviewResult: "unknown",
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0
    },
    {
      id: "guest-4",
      userId: "guest-user",
      original: "bright",
      translation: "яркий",
      direction: "en-ru",
      example: "The room feels bright and warm.",
      phonetic: "/braɪt/",
      dateAdded: new Date().toISOString(),
      nextReviewDate: today,
      lastReviewResult: "unknown",
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0
    }
  ]
}

function canUseStorage() {
  return typeof window !== "undefined"
}

function normalizeGuestCards(cards: CardRecord[]) {
  return cards.map((card) => ({
    ...card,
    lastReviewResult: card.lastReviewResult ?? "unknown"
  }))
}

export function isGuestSessionActive() {
  if (!canUseStorage()) {
    return false
  }

  return window.localStorage.getItem(GUEST_MODE_KEY) === "true"
}

export function setGuestSessionActive(value: boolean) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(GUEST_MODE_KEY, String(value))
}

export function clearGuestSession() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(GUEST_MODE_KEY)
  window.localStorage.removeItem(GUEST_CARDS_KEY)
  window.localStorage.removeItem(GUEST_REVIEW_LOGS_KEY)
}

export function getGuestCards() {
  if (!canUseStorage()) {
    return []
  }

  const existing = window.localStorage.getItem(GUEST_CARDS_KEY)

  if (!existing) {
    const sampleCards = createSampleCards()
    saveGuestCards(sampleCards)
    return sampleCards
  }

  try {
    const parsed = normalizeGuestCards(JSON.parse(existing) as CardRecord[])
    saveGuestCards(parsed)
    return parsed
  } catch {
    const sampleCards = createSampleCards()
    saveGuestCards(sampleCards)
    return sampleCards
  }
}

export function saveGuestCards(cards: CardRecord[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(GUEST_CARDS_KEY, JSON.stringify(cards))
}

export function getGuestReviewLogs() {
  if (!canUseStorage()) {
    return []
  }

  const existing = window.localStorage.getItem(GUEST_REVIEW_LOGS_KEY)

  if (!existing) {
    return []
  }

  try {
    return JSON.parse(existing) as GuestReviewLog[]
  } catch {
    return []
  }
}

export function recordGuestReview(cardId: string, result: ReviewResult) {
  const cards = getGuestCards()
  const today = getTodayDateKey()
  const outcome = getReviewOutcome(result, today)

  const nextCards = cards.map((card) =>
    card.id === cardId
      ? {
          ...card,
          nextReviewDate: outcome.nextReviewDate,
          lastReviewResult: outcome.lastReviewResult,
          reviewCount: card.reviewCount + outcome.reviewCountDelta,
          correctCount: card.correctCount + outcome.correctCountDelta,
          wrongCount: card.wrongCount + outcome.wrongCountDelta
        }
      : card
  )

  saveGuestCards(nextCards)

  const nextLogs = [
    ...getGuestReviewLogs(),
    {
      id: `${cardId}-${Date.now()}`,
      cardId,
      result,
      createdAt: new Date().toISOString()
    }
  ]

  if (canUseStorage()) {
    window.localStorage.setItem(GUEST_REVIEW_LOGS_KEY, JSON.stringify(nextLogs))
  }

  return nextCards
}

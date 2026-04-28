import type { Prisma } from "@prisma/client"

export const serializedCatalogWordSelect = {
  word: true,
  translation: true,
  translationAlternatives: true,
  example: true,
  phonetic: true,
  cefrLevel: true
} satisfies Prisma.WordCatalogSelect

export const serializedCardSelect = {
  id: true,
  userId: true,
  catalogWordId: true,
  original: true,
  translation: true,
  translationAlternatives: true,
  direction: true,
  example: true,
  phonetic: true,
  dateAdded: true,
  nextReviewDate: true,
  lastReviewResult: true,
  reviewCount: true,
  correctCount: true,
  wrongCount: true,
  catalogWord: {
    select: serializedCatalogWordSelect
  }
} satisfies Prisma.CardSelect

export const serializedAdminCardSelect = {
  ...serializedCardSelect,
  user: {
    select: {
      email: true
    }
  }
} satisfies Prisma.CardSelect

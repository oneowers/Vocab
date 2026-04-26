import type { Card, User } from "@prisma/client"

import type { AppUserRecord, CardRecord } from "@/lib/types"

export function serializeUser(user: User): AppUserRecord {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    streak: user.streak,
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    lastReviewDate: user.lastReviewDate
  }
}

export function serializeCard(
  card: Card & {
    user?: {
      email: string
    }
  }
): CardRecord {
  return {
    id: card.id,
    userId: card.userId,
    original: card.original,
    translation: card.translation,
    direction: card.direction as CardRecord["direction"],
    example: card.example ?? null,
    phonetic: card.phonetic ?? null,
    dateAdded: card.dateAdded.toISOString(),
    nextReviewDate: card.nextReviewDate,
    lastReviewResult: card.lastReviewResult as CardRecord["lastReviewResult"],
    reviewCount: card.reviewCount,
    correctCount: card.correctCount,
    wrongCount: card.wrongCount,
    userEmail: card.user?.email
  }
}

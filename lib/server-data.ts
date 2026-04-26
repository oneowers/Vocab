import { getPrisma } from "@/lib/prisma"
import {
  formatDateLabel,
  getTodayDateKey,
  isDueDate,
  listRecentDateKeys,
  listUpcomingDateKeys
} from "@/lib/date"
import { isMastered } from "@/lib/spaced-repetition"
import { serializeCard } from "@/lib/serializers"
import type { AdminAnalyticsPayload, CardRecord, StatsPayload } from "@/lib/types"

function getLongestStreak(dateKeys: string[]) {
  if (!dateKeys.length) {
    return 0
  }

  const uniqueSorted = Array.from(new Set(dateKeys)).sort()
  let longest = 1
  let current = 1

  for (let index = 1; index < uniqueSorted.length; index += 1) {
    const previous = new Date(`${uniqueSorted[index - 1]}T00:00:00.000Z`)
    const currentDate = new Date(`${uniqueSorted[index]}T00:00:00.000Z`)
    const difference =
      (currentDate.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000)

    if (difference === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

export function buildDashboardSummary(cards: CardRecord[], streak: number) {
  const today = getTodayDateKey()

  return {
    streak,
    totalCards: cards.length,
    dueToday: cards.filter((card) => isDueDate(card.nextReviewDate, today)).length,
    mastered: cards.filter((card) => isMastered(card.reviewCount)).length
  }
}

export async function buildUserStats(userId: string): Promise<StatsPayload> {
  const prisma = getPrisma()
  const [user, cards, reviewLogs] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId }
    }),
    prisma.card.findMany({
      where: { userId },
      orderBy: { wrongCount: "desc" }
    }),
    prisma.reviewLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })
  ])

  const today = getTodayDateKey()
  const last7 = listRecentDateKeys(7, today)
  const upcoming = listUpcomingDateKeys(7, today)
  const serializedCards = cards.map((card) => serializeCard(card))
  const reviewDates = reviewLogs.map((log) => log.createdAt.toISOString().slice(0, 10))
  const addedDates = cards.map((card) => card.dateAdded.toISOString().slice(0, 10))
  const correct = cards.reduce((total, card) => total + card.correctCount, 0)
  const wrong = cards.reduce((total, card) => total + card.wrongCount, 0)
  const totalReviewed = correct + wrong

  return {
    currentStreak: user.streak,
    longestStreak: getLongestStreak(reviewDates),
    accuracyRate: totalReviewed ? Math.round((correct / totalReviewed) * 100) : 0,
    cardsAdded: last7.map((date) => ({
      date,
      label: formatDateLabel(date),
      value: addedDates.filter((item) => item === date).length
    })),
    reviewsPerDay: last7.map((date) => ({
      date,
      label: formatDateLabel(date),
      value: reviewDates.filter((item) => item === date).length
    })),
    hardestCards: serializedCards
      .filter((card) => card.wrongCount > 0)
      .slice(0, 5),
    dueByDay: upcoming.map((date) => ({
      date,
      label: formatDateLabel(date),
      value: serializedCards.filter((card) => card.nextReviewDate === date).length
    }))
  }
}

export async function buildAdminAnalytics(): Promise<AdminAnalyticsPayload> {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const last30 = listRecentDateKeys(30, today)
  const last7 = last30.slice(-7)
  const [
    analyticsRows,
    totalsAggregate,
    totalUsers,
    totalCards,
    reviewLogs,
    recentLogs,
    cards
  ] =
    await Promise.all([
      prisma.appAnalytics.findMany({
        where: {
          date: {
            in: last30
          }
        },
        orderBy: {
          date: "asc"
        }
      }),
      prisma.appAnalytics.aggregate({
        _sum: {
          totalReviews: true,
          totalSessions: true
        }
      }),
      prisma.user.count(),
      prisma.card.count(),
      prisma.reviewLog.findMany({
        select: {
          userId: true,
          createdAt: true
        }
      }),
      prisma.reviewLog.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 20,
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      }),
      prisma.card.findMany({
        select: {
          id: true,
          original: true
        }
      })
    ])

  const analyticsByDate = new Map(analyticsRows.map((row) => [row.date, row]))
  const cardMap = new Map(cards.map((card) => [card.id, card.original]))

  return {
    days: last30.map((date) => {
      const row = analyticsByDate.get(date)
      return {
        date,
        label: formatDateLabel(date),
        newUsers: row?.newUsers ?? 0,
        newCards: row?.newCards ?? 0,
        totalSessions: row?.totalSessions ?? 0,
        totalReviews: row?.totalReviews ?? 0
      }
    }),
    totals: {
      totalUsers,
      totalCards,
      totalReviews: totalsAggregate._sum.totalReviews ?? 0,
      totalSessions: totalsAggregate._sum.totalSessions ?? 0,
      reviewsToday: analyticsByDate.get(today)?.totalReviews ?? 0,
      activeUsersLast7Days: new Set(
        reviewLogs
          .filter((log) => last7.includes(log.createdAt.toISOString().slice(0, 10)))
          .map((log) => log.userId)
      ).size
    },
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      email: log.user.email,
      word: cardMap.get(log.cardId) ?? "Card removed",
      result: log.result as "known" | "unknown",
      createdAt: log.createdAt.toISOString()
    }))
  }
}

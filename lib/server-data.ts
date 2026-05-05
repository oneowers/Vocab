import { Prisma } from "@prisma/client"

import { getOrCreateAppSettings } from "@/lib/catalog"
import { buildSeedReport } from "@/lib/cefr-seed"
import { serializedAdminCardSelect, serializedCardSelect } from "@/lib/db-selects"
import {
  addDaysToDateKey,
  formatDateLabel,
  getTodayDateKey,
  listRecentDateKeys,
  listUpcomingDateKeys,
  parseDateKey
} from "@/lib/date"
import { getPrisma } from "@/lib/prisma"
import {
  adminCacheTag,
  cacheAdminResource,
  cacheUserResource,
  sharedCacheTag,
  userCacheTag
} from "@/lib/server-cache"
import { serializeAppSettings, serializeCard } from "@/lib/serializers"
import type {
  AdminAnalyticsPayload,
  CardsResponse,
  DetailedStatsPayload,
  GrammarFindingRecord,
  PracticeEntryPayload,
  ProfileActivityDay,
  ProfileActivityMonthLabel,
  ProfileActivityPayload,
  ReviewSummaryPayload,
  StatsSummaryPayload,
  StatsPayload
} from "@/lib/types"

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

function getActivityLevel(count: number): ProfileActivityDay["level"] {
  if (count >= 10) {
    return 4
  }

  if (count >= 5) {
    return 3
  }

  if (count >= 2) {
    return 2
  }

  if (count >= 1) {
    return 1
  }

  return 0
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

  return {
    days,
    months
  }
}

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

function toCountMap(rows: Array<{ date: string; value: bigint | number }>) {
  return rows.reduce<Record<string, number>>((accumulator, row) => {
    accumulator[row.date] = Number(row.value)
    return accumulator
  }, {})
}

function toChartPoints(dates: string[], counts: Record<string, number>) {
  return dates.map((date) => ({
    date,
    label: formatDateLabel(date),
    value: counts[date] ?? 0
  }))
}

function getDailyTarget(value: number | null | undefined) {
  return typeof value === "number" && value > 0 ? value : 10
}

function serializeGrammarHistoryFinding(
  finding: {
    id: string
    severity: string
    confidence: number
    isCorrect: boolean
    originalText: string
    correctedText: string
    explanationRu: string
    scoreDelta: number
    createdAt: Date
    sourceType: string | null
    sourceId: string | null
    topic?: { key: string; titleEn: string } | null
  }
): GrammarFindingRecord {
  return {
    id: finding.id,
    topicKey: finding.topic?.key ?? "unknown",
    severity: finding.severity as GrammarFindingRecord["severity"],
    confidence: finding.confidence,
    isCorrect: finding.isCorrect,
    original: finding.originalText,
    corrected: finding.correctedText,
    explanationRu: finding.explanationRu,
    scoreDelta: finding.scoreDelta,
    createdAt: finding.createdAt.toISOString(),
    topicTitleEn: finding.topic?.titleEn ?? "Unknown Topic",
    sourceType: finding.sourceType as GrammarFindingRecord["sourceType"],
    sourceId: finding.sourceId
  }
}

async function buildCardsPageData(userId: string): Promise<CardsResponse> {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const todayStart = new Date(`${today}T00:00:00.000Z`)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

  const [cards, totalCards, settings, user, claimedToday] = await Promise.all([
    prisma.card.findMany({
      where: {
        userId
      },
      orderBy: [{ nextReviewDate: "asc" }, { dateAdded: "desc" }],
      select: serializedCardSelect
    }),
    prisma.card.count({
      where: {
        userId
      }
    }),
    getOrCreateAppSettings(prisma),
    prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      },
      select: {
        streak: true,
        cefrLevel: true,
        dailyWordTarget: true,
        firstPracticeDate: true
      }
    }),
    prisma.userCatalogWord.count({
      where: {
        userId,
        status: "ACTIVE",
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart
        }
      }
    })
  ])

  const serializedCards = cards.map((card) => serializeCard(card))
  const dailyTarget = getDailyTarget(user.dailyWordTarget)
  const rawDueToday = serializedCards.filter((card) => card.nextReviewDate <= today).length
  const todayCount = Math.min(rawDueToday, dailyTarget)
  const waitingCount = Math.max(serializedCards.length - todayCount, 0)
  const weakCards = serializedCards.filter((card) => (card.wrongCount * 2 - card.correctCount) >= 3)

  return {
    cards: serializedCards,
    weakCards,
    summary: {
      streak: user.streak,
      reviewLives: settings.reviewLives,
      totalCards,
      dueToday: todayCount,
      mastered: serializedCards.filter((card) => card.reviewCount >= 3).length,
      weakCardsCount: weakCards.length,
      isFirstPractice: !user.firstPracticeDate
    },
    dailyCatalog: {
      dailyTarget,
      todayCount,
      savedCount: totalCards,
      waitingCount,
      claimedToday,
      dailyLimit: settings.dailyNewCardsLimit,
      remainingToday: Math.max(settings.dailyNewCardsLimit - claimedToday, 0),
      cefrLevel: user.cefrLevel
    }
  }
}

async function buildReviewSummaryData(userId: string): Promise<ReviewSummaryPayload> {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const todayStart = new Date(`${today}T00:00:00.000Z`)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

  const [settings, user, totalCards, masteredCount, rawDueToday, claimedToday, weakCount] =
    await Promise.all([
      getOrCreateAppSettings(prisma),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          streak: true,
          cefrLevel: true,
          dailyWordTarget: true,
          firstPracticeDate: true
        }
      }),
      prisma.card.count({
        where: { userId }
      }),
      prisma.card.count({
        where: {
          userId,
          reviewCount: {
            gte: 3
          }
        }
      }),
      prisma.card.count({
        where: {
          userId,
          nextReviewDate: {
            lte: today
          }
        }
      }),
      prisma.userCatalogWord.count({
        where: {
          userId,
          status: "ACTIVE",
          createdAt: {
            gte: todayStart,
            lt: tomorrowStart
          }
        }
      }),
      prisma.$queryRaw<Array<{ value: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS value
        FROM "Card"
        WHERE "userId" = ${userId}
          AND ("wrongCount" * 2 - "correctCount") >= 3
      `)
    ])

  const dailyTarget = getDailyTarget(user.dailyWordTarget)
  const dueToday = Math.min(rawDueToday, dailyTarget)
  const weakCardsCount = Number(weakCount[0]?.value ?? 0)

  return {
    summary: {
      streak: user.streak,
      reviewLives: settings.reviewLives,
      totalCards,
      dueToday,
      mastered: masteredCount,
      weakCardsCount,
      isFirstPractice: !user.firstPracticeDate
    },
    dailyCatalog: {
      dailyTarget,
      todayCount: dueToday,
      savedCount: totalCards,
      waitingCount: Math.max(totalCards - dueToday, 0),
      claimedToday,
      dailyLimit: settings.dailyNewCardsLimit,
      remainingToday: Math.max(settings.dailyNewCardsLimit - claimedToday, 0),
      cefrLevel: user.cefrLevel
    }
  }
}

export function getUserCardsPageData(userId: string): Promise<CardsResponse> {
  return cacheUserResource(
    [`cards-page:${userId}`],
    [userCacheTag.cards(userId), userCacheTag.review(userId), sharedCacheTag.appSettings],
    () => buildCardsPageData(userId)
  )
}

export function getUserReviewData(userId: string): Promise<CardsResponse> {
  return cacheUserResource(
    [`review-page:${userId}`],
    [userCacheTag.cards(userId), userCacheTag.review(userId), sharedCacheTag.appSettings],
    () => buildCardsPageData(userId)
  )
}

export function getUserReviewSummaryData(userId: string): Promise<ReviewSummaryPayload> {
  return cacheUserResource(
    [`review-summary:${userId}`],
    [userCacheTag.cards(userId), userCacheTag.review(userId), sharedCacheTag.appSettings],
    () => buildReviewSummaryData(userId)
  )
}

export async function getPracticeEntryData(userId: string): Promise<PracticeEntryPayload> {
  const prisma = getPrisma()
  const [reviewSummary, grammarSummary, historyRaw, appSettingsRaw] = await Promise.all([
    getUserReviewSummaryData(userId),
    import("@/lib/grammar").then((m) => m.getUserGrammarSummaryData(userId)),
    prisma.grammarFinding.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { topic: { select: { key: true, titleEn: true } } }
    }),
    getOrCreateAppSettings(prisma)
  ])

  return {
    reviewSummary,
    grammarSummary,
    historyPreview: historyRaw.map(serializeGrammarHistoryFinding),
    appSettings: serializeAppSettings(appSettingsRaw)
  }
}

export async function getPracticeHistoryData(userId: string) {
  const prisma = getPrisma()
  const historyRaw = await prisma.grammarFinding.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { topic: { select: { key: true, titleEn: true } } }
  })

  return historyRaw.map(serializeGrammarHistoryFinding)
}

export async function getPracticePageData(userId: string) {
  const prisma = getPrisma()
  const [reviewData, grammarData, historyRaw, appSettingsRaw] = await Promise.all([
    getUserReviewData(userId),
    import("@/lib/grammar").then((m) => m.getUserGrammarSkillsData(userId, "weak")),
    prisma.grammarFinding.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { topic: { select: { key: true, titleEn: true } } }
    }),
    getOrCreateAppSettings(prisma)
  ])

  const appSettings = serializeAppSettings(appSettingsRaw)

  const historyData = historyRaw.map(serializeGrammarHistoryFinding)

  return {
    reviewData,
    grammarData,
    historyData,
    appSettings
  }
}

export async function buildUserStats(userId: string): Promise<StatsPayload> {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const last7 = listRecentDateKeys(7, today)
  const upcoming = listUpcomingDateKeys(7, today)
  const last7Start = parseDateKey(last7[0])

  const [user, totals, hardestCards, dueCounts, reviewDateCounts, addedDateCounts] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { streak: true }
      }),
      prisma.card.aggregate({
        where: { userId },
        _sum: {
          correctCount: true,
          wrongCount: true
        }
      }),
      prisma.card.findMany({
        where: {
          userId,
          wrongCount: {
            gt: 0
          }
        },
        orderBy: { wrongCount: "desc" },
        take: 5,
        select: serializedCardSelect
      }),
      prisma.card.groupBy({
        by: ["nextReviewDate"],
        where: {
          userId,
          nextReviewDate: {
            in: upcoming
          }
        },
        _count: {
          _all: true
        }
      }),
      prisma.$queryRaw<Array<{ date: string; value: bigint }>>(Prisma.sql`
        SELECT
          TO_CHAR(DATE("createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
          COUNT(*)::bigint AS value
        FROM "ReviewLog"
        WHERE "userId" = ${userId}
        GROUP BY 1
      `),
      prisma.$queryRaw<Array<{ date: string; value: bigint }>>(Prisma.sql`
        SELECT
          TO_CHAR(DATE("dateAdded" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
          COUNT(*)::bigint AS value
        FROM "Card"
        WHERE "userId" = ${userId}
          AND "dateAdded" >= ${last7Start}
        GROUP BY 1
      `)
    ])

  const correct = totals._sum.correctCount ?? 0
  const wrong = totals._sum.wrongCount ?? 0
  const totalReviewed = correct + wrong
  const reviewCountsByDate = toCountMap(reviewDateCounts)
  const reviewDates = Object.keys(reviewCountsByDate).filter((date) => reviewCountsByDate[date] > 0)
  const addedCountsByDate = toCountMap(addedDateCounts)
  const dueCountsByDate = dueCounts.reduce<Record<string, number>>((accumulator, row) => {
    accumulator[row.nextReviewDate] = row._count._all
    return accumulator
  }, {})

  return {
    currentStreak: user.streak,
    longestStreak: getLongestStreak(reviewDates),
    accuracyRate: totalReviewed ? Math.round((correct / totalReviewed) * 100) : 0,
    cardsAdded: toChartPoints(last7, addedCountsByDate),
    reviewsPerDay: toChartPoints(last7, reviewCountsByDate),
    hardestCards: hardestCards.map((card) => serializeCard(card)),
    dueByDay: toChartPoints(upcoming, dueCountsByDate)
  }
}

export function getUserStatsData(userId: string): Promise<StatsPayload> {
  return cacheUserResource(
    [`user-stats:${userId}`],
    [userCacheTag.stats(userId), userCacheTag.review(userId), userCacheTag.cards(userId)],
    () => buildUserStats(userId)
  )
}

export async function buildDetailedUserStats(userId: string, daysCount = 7): Promise<DetailedStatsPayload> {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const recentDays = listRecentDateKeys(daysCount, today)
  const rangeStart = parseDateKey(recentDays[0])

  const [user, totalCardsLearned, reviewDateCounts, cardsByLevel, recentMistakes] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { streak: true }
      }),
      prisma.card.count({
        where: {
          userId,
          reviewCount: {
            gt: 0
          }
        }
      }),
      prisma.$queryRaw<Array<{ date: string; value: bigint }>>(Prisma.sql`
        SELECT
          TO_CHAR(DATE("createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
          COUNT(*)::bigint AS value
        FROM "ReviewLog"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${rangeStart}
        GROUP BY 1
      `),
      prisma.card.findMany({
        where: {
          userId,
          catalogWord: {
            isNot: null
          }
        },
        select: {
          catalogWord: {
            select: {
              cefrLevel: true
            }
          }
        }
      }),
      prisma.reviewLog.findMany({
        where: {
          userId,
          result: "unknown"
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 10,
        select: {
          id: true,
          cardId: true,
          createdAt: true
        }
      })
    ])

  const countsByDate = toCountMap(reviewDateCounts)
  const activeDays = Object.values(countsByDate).filter((count) => count > 0).length
  const weeklyProgress = toChartPoints(recentDays, countsByDate)
  const cardsByCefrLevel = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0
  }

  for (const card of cardsByLevel) {
    const level = card.catalogWord?.cefrLevel
    if (level) {
      cardsByCefrLevel[level] += 1
    }
  }

  const recentMistakeCardIds = Array.from(new Set(recentMistakes.map((item) => item.cardId)))
  const recentMistakeCards =
    recentMistakeCardIds.length === 0
      ? []
      : await prisma.card.findMany({
          where: {
            id: {
              in: recentMistakeCardIds
            }
          },
          select: serializedCardSelect
        })
  const recentMistakeCardMap = new Map(
    recentMistakeCards.map((card) => [
      card.id,
      card.catalogWord?.word ?? card.original ?? card.translation ?? "Unknown word"
    ])
  )

  return {
    summary: {
      totalCardsLearned,
      currentStreak: user.streak,
      activeDays
    },
    weeklyProgress,
    cardsByCefrLevel,
    recentMistakes: recentMistakes.map((item) => ({
      id: item.id,
      cardId: item.cardId,
      word: recentMistakeCardMap.get(item.cardId) ?? "Unknown word",
      createdAt: item.createdAt.toISOString()
    }))
  }
}

export async function buildDetailedStatsSummary(userId: string, daysCount = 7): Promise<StatsSummaryPayload> {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const recentDays = listRecentDateKeys(daysCount, today)
  const rangeStart = parseDateKey(recentDays[0])

  const [user, totalCardsLearned, reviewDateCounts] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { streak: true }
    }),
    prisma.card.count({
      where: {
        userId,
        reviewCount: {
          gt: 0
        }
      }
    }),
    prisma.$queryRaw<Array<{ date: string; value: bigint }>>(Prisma.sql`
      SELECT
        TO_CHAR(DATE("createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
        COUNT(*)::bigint AS value
      FROM "ReviewLog"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${rangeStart}
      GROUP BY 1
    `)
  ])

  const countsByDate = toCountMap(reviewDateCounts)

  return {
    totalCardsLearned,
    currentStreak: user.streak,
    activeDays: Object.values(countsByDate).filter((count) => count > 0).length
  }
}

export async function buildDetailedStatsWeeklyProgress(userId: string, daysCount = 7) {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const recentDays = listRecentDateKeys(daysCount, today)
  const rangeStart = parseDateKey(recentDays[0])
  const reviewDateCounts = await prisma.$queryRaw<Array<{ date: string; value: bigint }>>(Prisma.sql`
    SELECT
      TO_CHAR(DATE("createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
      COUNT(*)::bigint AS value
    FROM "ReviewLog"
    WHERE "userId" = ${userId}
      AND "createdAt" >= ${rangeStart}
    GROUP BY 1
  `)

  return toChartPoints(recentDays, toCountMap(reviewDateCounts))
}

export async function buildDetailedStatsCefrBreakdown(userId: string) {
  const prisma = getPrisma()
  const cardsByLevel = await prisma.card.findMany({
    where: {
      userId,
      catalogWord: {
        isNot: null
      }
    },
    select: {
      catalogWord: {
        select: {
          cefrLevel: true
        }
      }
    }
  })

  const cardsByCefrLevel = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0
  }

  for (const card of cardsByLevel) {
    const level = card.catalogWord?.cefrLevel
    if (level) {
      cardsByCefrLevel[level] += 1
    }
  }

  return cardsByCefrLevel
}

export async function buildDetailedStatsMistakes(userId: string) {
  const prisma = getPrisma()
  const recentMistakes = await prisma.reviewLog.findMany({
    where: {
      userId,
      result: "unknown"
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10,
    select: {
      id: true,
      cardId: true,
      createdAt: true
    }
  })

  const recentMistakeCardIds = Array.from(new Set(recentMistakes.map((item) => item.cardId)))
  const recentMistakeCards =
    recentMistakeCardIds.length === 0
      ? []
      : await prisma.card.findMany({
          where: {
            id: {
              in: recentMistakeCardIds
            }
          },
          select: serializedCardSelect
        })
  const recentMistakeCardMap = new Map(
    recentMistakeCards.map((card) => [
      card.id,
      card.catalogWord?.word ?? card.original ?? card.translation ?? "Unknown word"
    ])
  )

  return recentMistakes.map((item) => ({
    id: item.id,
    cardId: item.cardId,
    word: recentMistakeCardMap.get(item.cardId) ?? "Unknown word",
    createdAt: item.createdAt.toISOString()
  }))
}

export function getDetailedUserStatsData(userId: string, daysCount = 7): Promise<DetailedStatsPayload> {
  return cacheUserResource(
    [`detailed-user-stats:${userId}:${daysCount}`],
    [userCacheTag.stats(userId), userCacheTag.review(userId), userCacheTag.cards(userId)],
    () => buildDetailedUserStats(userId, daysCount)
  )
}

export function getDetailedStatsSummaryData(userId: string, daysCount = 7): Promise<StatsSummaryPayload> {
  return cacheUserResource(
    [`detailed-user-stats:summary:${userId}:${daysCount}`],
    [userCacheTag.stats(userId), userCacheTag.review(userId), userCacheTag.cards(userId)],
    () => buildDetailedStatsSummary(userId, daysCount)
  )
}

export function getDetailedStatsWeeklyProgressData(userId: string, daysCount = 7) {
  return cacheUserResource(
    [`detailed-user-stats:weekly:${userId}:${daysCount}`],
    [userCacheTag.stats(userId), userCacheTag.review(userId)],
    () => buildDetailedStatsWeeklyProgress(userId, daysCount)
  )
}

export function getDetailedStatsCefrBreakdownData(userId: string) {
  return cacheUserResource(
    [`detailed-user-stats:cefr:${userId}`],
    [userCacheTag.stats(userId), userCacheTag.cards(userId)],
    () => buildDetailedStatsCefrBreakdown(userId)
  )
}

export function getDetailedStatsMistakesData(userId: string) {
  return cacheUserResource(
    [`detailed-user-stats:mistakes:${userId}`],
    [userCacheTag.stats(userId), userCacheTag.review(userId), userCacheTag.cards(userId)],
    () => buildDetailedStatsMistakes(userId)
  )
}

export async function buildProfileActivity(userId: string): Promise<ProfileActivityPayload> {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const activityGrid = buildActivityGrid(today)
  const startDate = new Date(Date.UTC(parseDateKey(today).getUTCFullYear(), 0, 1))
  const endDate = new Date(`${today}T23:59:59.999Z`)
  const reviewDateCounts = await prisma.$queryRaw<Array<{ date: string; value: bigint }>>(Prisma.sql`
    SELECT
      TO_CHAR(DATE("createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
      COUNT(*)::bigint AS value
    FROM "ReviewLog"
    WHERE "userId" = ${userId}
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY 1
  `)

  const countsByDate = toCountMap(reviewDateCounts)

  const days = activityGrid.days.map((day) => {
    const count = countsByDate[day.date] ?? 0

    return {
      date: day.date,
      count,
      level: day.inCurrentYear ? getActivityLevel(count) : 0
    }
  })

  return {
    activeDaysLastYear: Object.values(countsByDate).filter((count) => count > 0).length,
    totalReviewsLastYear: reviewDateCounts.reduce((total, row) => total + Number(row.value), 0),
    days,
    months: activityGrid.months
  }
}

export function getUserProfileActivityData(userId: string): Promise<ProfileActivityPayload> {
  return cacheUserResource(
    [`profile-activity:${userId}`],
    [userCacheTag.profile(userId), userCacheTag.review(userId)],
    () => buildProfileActivity(userId)
  )
}

export async function buildAdminAnalytics(): Promise<AdminAnalyticsPayload> {
  const prisma = getPrisma()
  const today = getTodayDateKey()
  const last30 = listRecentDateKeys(30, today)
  const last7Start = parseDateKey(addDaysToDateKey(today, -6))
  const todayStart = new Date(`${today}T00:00:00.000Z`)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)
  const [
    totalsAggregate,
    totalUsers,
    totalCards,
    activeUsersLast7Days,
    retentionCounts,
    wrongByLevelRows,
    catalogClaimsToday,
    catalogLinkedCards,
    recentLogs,
    seedCatalog
  ] = await Promise.all([
    prisma.appAnalytics.aggregate({
      _sum: {
        totalReviews: true,
        totalSessions: true,
        onboardingStarted: true,
        onboardingCompleted: true,
        firstPracticeStarted: true,
        firstPracticeCompleted: true,
        firstPracticeD1Return: true,
        aiChallengeStarted: true,
        aiChallengeCompleted: true
      }
    }),
    prisma.user.count(),
    prisma.card.count(),
    prisma.reviewLog
      .groupBy({
        by: ["userId"],
        where: {
          createdAt: {
            gte: last7Start
          }
        }
      })
      .then((rows) => rows.length),
    Promise.all([
      prisma.$queryRaw<Array<{ value: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS value
        FROM "User"
        WHERE "lastActiveAt" IS NOT NULL
          AND "lastActiveAt" >= "createdAt" + INTERVAL '1 day'
          AND "lastActiveAt" < "createdAt" + INTERVAL '2 days'
      `),
      prisma.$queryRaw<Array<{ value: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS value
        FROM "User"
        WHERE "lastActiveAt" IS NOT NULL
          AND "lastActiveAt" >= "createdAt" + INTERVAL '7 days'
          AND "lastActiveAt" < "createdAt" + INTERVAL '8 days'
      `),
      prisma.$queryRaw<Array<{ value: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS value
        FROM "User"
        WHERE "lastActiveAt" IS NOT NULL
          AND "lastActiveAt" >= "createdAt" + INTERVAL '30 days'
          AND "lastActiveAt" < "createdAt" + INTERVAL '31 days'
      `)
    ]),
    prisma.$queryRaw<Array<{ level: string; value: bigint }>>(Prisma.sql`
      SELECT
        wc."cefrLevel" AS level,
        COUNT(*)::bigint AS value
      FROM "ReviewLog" rl
      INNER JOIN "Card" c ON c."id" = rl."cardId"
      INNER JOIN "WordCatalog" wc ON wc."id" = c."catalogWordId"
      WHERE rl."result" = 'unknown'
        AND rl."createdAt" >= ${todayStart}
        AND rl."createdAt" < ${tomorrowStart}
      GROUP BY wc."cefrLevel"
    `),
    prisma.userCatalogWord.count({
      where: {
        status: "ACTIVE",
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart
        }
      }
    }),
    prisma.card.count({
      where: {
        catalogWordId: {
          not: null
        }
      }
    }),
    prisma.reviewLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 20,
      select: {
        id: true,
        cardId: true,
        result: true,
        createdAt: true,
        user: {
          select: {
            email: true
          }
        }
      }
    }),
    buildSeedReport(prisma)
  ])

  const retention = {
    activeUsersD1: Number(retentionCounts[0][0]?.value ?? 0),
    activeUsersD7: Number(retentionCounts[1][0]?.value ?? 0),
    activeUsersD30: Number(retentionCounts[2][0]?.value ?? 0)
  }
  const wrongByCefr = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0
  }

  for (const row of wrongByLevelRows) {
    const level = row.level as keyof typeof wrongByCefr
    if (level in wrongByCefr) {
      wrongByCefr[level] = Number(row.value)
    }
  }

  const catalogRatio = totalCards > 0 ? catalogLinkedCards / totalCards : 0

  await prisma.appAnalytics.upsert({
    where: {
      date: today
    },
    update: {
      activeUsersD1: retention.activeUsersD1,
      activeUsersD7: retention.activeUsersD7,
      activeUsersD30: retention.activeUsersD30,
      wrongByA1: wrongByCefr.A1,
      wrongByA2: wrongByCefr.A2,
      wrongByB1: wrongByCefr.B1,
      wrongByB2: wrongByCefr.B2,
      wrongByC1: wrongByCefr.C1,
      wrongByC2: wrongByCefr.C2,
      catalogClaimsToday,
      catalogVsCustomRatio: catalogRatio
    },
    create: {
      date: today,
      activeUsersD1: retention.activeUsersD1,
      activeUsersD7: retention.activeUsersD7,
      activeUsersD30: retention.activeUsersD30,
      wrongByA1: wrongByCefr.A1,
      wrongByA2: wrongByCefr.A2,
      wrongByB1: wrongByCefr.B1,
      wrongByB2: wrongByCefr.B2,
      wrongByC1: wrongByCefr.C1,
      wrongByC2: wrongByCefr.C2,
      catalogClaimsToday,
      catalogVsCustomRatio: catalogRatio
    }
  })

  const analyticsRows = await prisma.appAnalytics.findMany({
    where: {
      date: {
        in: last30
      }
    },
    orderBy: {
      date: "asc"
    }
  })

  const recentCardIds = Array.from(new Set(recentLogs.map((log) => log.cardId)))
  const recentCards =
    recentCardIds.length === 0
      ? []
      : await prisma.card.findMany({
          where: {
            id: {
              in: recentCardIds
            }
          },
          select: serializedAdminCardSelect
        })

  const analyticsByDate = new Map(analyticsRows.map((row) => [row.date, row]))
  const cardMap = new Map(
    recentCards.map((card) => [card.id, card.catalogWord?.word ?? card.original ?? "Card removed"])
  )

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
      activeUsersLast7Days
    },
    onboarding: {
      onboardingStarted: totalsAggregate._sum.onboardingStarted ?? 0,
      onboardingCompleted: totalsAggregate._sum.onboardingCompleted ?? 0,
      firstPracticeStarted: totalsAggregate._sum.firstPracticeStarted ?? 0,
      firstPracticeCompleted: totalsAggregate._sum.firstPracticeCompleted ?? 0,
      firstPracticeD1Return: totalsAggregate._sum.firstPracticeD1Return ?? 0,
      aiChallengeStarted: totalsAggregate._sum.aiChallengeStarted ?? 0,
      aiChallengeCompleted: totalsAggregate._sum.aiChallengeCompleted ?? 0
    },
    retention,
    wrongByCefr,
    catalogEngagement: {
      claimsToday: catalogClaimsToday,
      catalogRatio
    },
    seedCatalog,
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      email: log.user.email,
      word: cardMap.get(log.cardId) ?? "Card removed",
      result: log.result as "known" | "unknown",
      createdAt: log.createdAt.toISOString()
    }))
  }
}

export function getAdminAnalyticsData(): Promise<AdminAnalyticsPayload> {
  return cacheAdminResource(
    ["admin-analytics"],
    [adminCacheTag.analytics],
    () => buildAdminAnalytics()
  )
}

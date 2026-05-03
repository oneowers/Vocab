import { Prisma } from "@prisma/client"
import type { GrammarTopic, PrismaClient } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import { serializeGrammarTopic } from "@/lib/serializers"
import { adminCacheTag, cacheUserResource, userCacheTag } from "@/lib/server-cache"
import type {
  GrammarFindingRecord,
  GrammarScoreBand,
  GrammarSeverity,
  GrammarSkillsPayload,
  PracticeWritingGrammarFinding
} from "@/lib/types"

export const GRAMMAR_CONFIDENCE_THRESHOLD = 0.65
export const MAX_GRAMMAR_FINDINGS_PER_CHECK = 10
export const WEAK_GRAMMAR_SCORE_THRESHOLD = -15

const GRAMMAR_SEVERITY_DELTAS = {
  low: -5,
  medium: -10,
  high: -20
} satisfies Record<GrammarSeverity, number>

const GRAMMAR_SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3
} satisfies Record<GrammarSeverity, number>

type GrammarPrismaClient = PrismaClient | Prisma.TransactionClient

export interface ActiveGrammarTopicForAi {
  id: string
  key: string
  titleEn: string
  titleRu: string
  category: string
  cefrLevel: string
  description: string
}

export interface NormalizedGrammarFinding extends PracticeWritingGrammarFinding {
  topicId: string
}

function isGrammarSeverity(value: unknown): value is GrammarSeverity {
  return value === "low" || value === "medium" || value === "high"
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, value))
}

function toTopicMap(topics: Array<Pick<GrammarTopic, "id" | "key">>) {
  return new Map(topics.map((topic) => [topic.key, topic.id]))
}

export function normalizeGrammarTopicKey(value: string) {
  return value.trim().toLowerCase()
}

export function isValidGrammarTopicKey(value: string) {
  return /^[a-z0-9_]+$/.test(value)
}

export function getGrammarScoreBand(score: number, evidenceCount: number): GrammarScoreBand {
  if (evidenceCount <= 0 || score === 0) {
    return "unknown"
  }

  if (score > 0) {
    return "strong"
  }

  if (score >= -15) {
    return "minor"
  }

  if (score >= -40) {
    return "weak"
  }

  if (score >= -70) {
    return "serious"
  }

  return "critical"
}

export async function getActiveGrammarTopicsForAi(
  prisma: GrammarPrismaClient
): Promise<ActiveGrammarTopicForAi[]> {
  return prisma.grammarTopic.findMany({
    where: {
      isActive: true
    },
    orderBy: [{ cefrLevel: "asc" }, { category: "asc" }, { titleEn: "asc" }],
    select: {
      id: true,
      key: true,
      titleEn: true,
      titleRu: true,
      category: true,
      cefrLevel: true,
      description: true
    }
  })
}

export function normalizeGrammarFindings(
  rawFindings: unknown,
  activeTopics: Array<Pick<GrammarTopic, "id" | "key">>
): NormalizedGrammarFinding[] {
  if (!Array.isArray(rawFindings)) {
    return []
  }

  const topicMap = toTopicMap(activeTopics)
  const normalized: NormalizedGrammarFinding[] = []

  for (const rawFinding of rawFindings) {
    if (normalized.length >= MAX_GRAMMAR_FINDINGS_PER_CHECK) {
      break
    }

    if (!rawFinding || typeof rawFinding !== "object" || Array.isArray(rawFinding)) {
      continue
    }

    const value = rawFinding as Record<string, unknown>
    const topicKey =
      typeof value.topicKey === "string" ? normalizeGrammarTopicKey(value.topicKey) : ""
    const topicId = topicMap.get(topicKey)
    const original = typeof value.original === "string" ? value.original.trim() : ""
    const corrected = typeof value.corrected === "string" ? value.corrected.trim() : ""
    const explanationRu =
      typeof value.explanationRu === "string" ? value.explanationRu.trim() : ""
    const confidence =
      typeof value.confidence === "number" && Number.isFinite(value.confidence)
        ? clampConfidence(value.confidence)
        : null

    const isCorrect = !!value.isCorrect

    if (
      !topicId ||
      (!isCorrect && !isGrammarSeverity(value.severity)) ||
      confidence === null ||
      !original ||
      (!isCorrect && !corrected)
    ) {
      continue
    }

    normalized.push({
      topicId,
      topicKey,
      severity: isCorrect ? "low" : (value.severity as GrammarSeverity),
      confidence,
      isCorrect,
      original,
      corrected: isCorrect ? original : corrected,
      explanationRu
    })
  }

  return normalized
}

export function toClientGrammarFinding(
  finding: NormalizedGrammarFinding
): PracticeWritingGrammarFinding {
  return {
    topicKey: finding.topicKey,
    severity: finding.severity,
    confidence: finding.confidence,
    isCorrect: finding.isCorrect,
    original: finding.original,
    corrected: finding.corrected,
    explanationRu: finding.explanationRu
  }
}

function selectStrongestAppliedFindings(findings: NormalizedGrammarFinding[]) {
  const strongestByTopic = new Map<string, NormalizedGrammarFinding>()

  for (const finding of findings) {
    if (finding.confidence < GRAMMAR_CONFIDENCE_THRESHOLD) {
      continue
    }

    const existing = strongestByTopic.get(finding.topicId)

    // A mistake always overrides a correct usage for the same topic in the same session
    if (existing && existing.isCorrect && !finding.isCorrect) {
      strongestByTopic.set(finding.topicId, finding)
      continue
    }

    if (existing && !existing.isCorrect && finding.isCorrect) {
      continue
    }

    if (
      !existing ||
      (finding.isCorrect && !existing.isCorrect) ||
      (!finding.isCorrect && !existing.isCorrect && GRAMMAR_SEVERITY_RANK[finding.severity] > GRAMMAR_SEVERITY_RANK[existing.severity]) ||
      (
        GRAMMAR_SEVERITY_RANK[finding.severity] === GRAMMAR_SEVERITY_RANK[existing.severity] &&
        finding.confidence > existing.confidence
      )
    ) {
      strongestByTopic.set(finding.topicId, finding)
    }
  }

  return Array.from(strongestByTopic.values())
}

export async function applyGrammarFindingsToWritingChallenge(
  tx: Prisma.TransactionClient,
  options: {
    userId: string
    challengeId: string
    findings: NormalizedGrammarFinding[]
  }
): Promise<PracticeWritingGrammarFinding[]> {
  const now = new Date()
  const marked = await tx.practiceWritingChallenge.updateMany({
    where: {
      id: options.challengeId,
      userId: options.userId,
      grammarScoreAppliedAt: null
    },
    data: {
      grammarScoreAppliedAt: now
    }
  })

  if (marked.count !== 1) {
    return []
  }

  const appliedFindings = selectStrongestAppliedFindings(options.findings)

  for (const finding of appliedFindings) {
    const scoreDelta = finding.isCorrect ? 2 : GRAMMAR_SEVERITY_DELTAS[finding.severity]

    await tx.grammarFinding.create({
      data: {
        userId: options.userId,
        topicId: finding.topicId,
        sourceType: "writing_challenge",
        sourceId: options.challengeId,
        originalText: finding.original,
        correctedText: finding.corrected,
        explanationRu: finding.explanationRu,
        severity: finding.severity,
        confidence: finding.confidence,
        isCorrect: finding.isCorrect || false,
        scoreDelta
      }
    })

    await tx.userGrammarSkill.upsert({
      where: {
        userId_topicId: {
          userId: options.userId,
          topicId: finding.topicId
        }
      },
      create: {
        userId: options.userId,
        topicId: finding.topicId,
        score: scoreDelta,
        evidenceCount: 1,
        negativeEvidenceCount: finding.isCorrect ? 0 : 1,
        positiveEvidenceCount: finding.isCorrect ? 1 : 0,
        lastDetectedAt: now
      },
      update: {
        score: {
          increment: scoreDelta
        },
        evidenceCount: {
          increment: 1
        },
        negativeEvidenceCount: {
          increment: finding.isCorrect ? 0 : 1
        },
        positiveEvidenceCount: {
          increment: finding.isCorrect ? 1 : 0
        },
        lastDetectedAt: now
      }
    })

    await tx.userGrammarSkill.updateMany({
      where: {
        userId: options.userId,
        topicId: finding.topicId,
        score: {
          lt: -100
        }
      },
      data: {
        score: -100
      }
    })

    await tx.userGrammarSkill.updateMany({
      where: {
        userId: options.userId,
        topicId: finding.topicId,
        score: {
          gt: 100
        }
      },
      data: {
        score: 100
      }
    })
  }

  return appliedFindings.map(toClientGrammarFinding)
}

export async function applyGrammarFindingsToTranslationChallenge(
  tx: Prisma.TransactionClient,
  options: {
    userId: string
    challengeId: string
    findings: NormalizedGrammarFinding[]
  }
): Promise<PracticeWritingGrammarFinding[]> {
  const now = new Date()
  const marked = await tx.practiceTranslationChallenge.updateMany({
    where: {
      id: options.challengeId,
      userId: options.userId,
      grammarScoreAppliedAt: null
    },
    data: {
      grammarScoreAppliedAt: now
    }
  })

  if (marked.count !== 1) {
    return []
  }

  const appliedFindings = selectStrongestAppliedFindings(options.findings)

  for (const finding of appliedFindings) {
    const scoreDelta = finding.isCorrect ? 2 : GRAMMAR_SEVERITY_DELTAS[finding.severity]

    await tx.grammarFinding.create({
      data: {
        userId: options.userId,
        topicId: finding.topicId,
        sourceType: "translation_challenge",
        sourceId: options.challengeId,
        originalText: finding.original,
        correctedText: finding.corrected,
        explanationRu: finding.explanationRu,
        severity: finding.severity,
        confidence: finding.confidence,
        isCorrect: finding.isCorrect || false,
        scoreDelta
      }
    })

    await tx.userGrammarSkill.upsert({
      where: {
        userId_topicId: {
          userId: options.userId,
          topicId: finding.topicId
        }
      },
      create: {
        userId: options.userId,
        topicId: finding.topicId,
        score: scoreDelta,
        evidenceCount: 1,
        negativeEvidenceCount: finding.isCorrect ? 0 : 1,
        positiveEvidenceCount: finding.isCorrect ? 1 : 0,
        lastDetectedAt: now
      },
      update: {
        score: {
          increment: scoreDelta
        },
        evidenceCount: {
          increment: 1
        },
        negativeEvidenceCount: {
          increment: finding.isCorrect ? 0 : 1
        },
        positiveEvidenceCount: {
          increment: finding.isCorrect ? 1 : 0
        },
        lastDetectedAt: now
      }
    })
    
    // Clamp scores
    await tx.userGrammarSkill.updateMany({
      where: {
        userId: options.userId,
        topicId: finding.topicId,
        score: { lt: -100 }
      },
      data: { score: -100 }
    })

    await tx.userGrammarSkill.updateMany({
      where: {
        userId: options.userId,
        topicId: finding.topicId,
        score: { gt: 100 }
      },
      data: { score: 100 }
    })
  }

  return appliedFindings.map(toClientGrammarFinding)
}

function serializeLatestGrammarFinding(
  finding: {
    id: string
    originalText: string
    correctedText: string
    explanationRu: string
    severity: GrammarSeverity
    confidence: number
    isCorrect: boolean
    scoreDelta: number
    createdAt: Date
  },
  topicKey: string
): GrammarFindingRecord {
  return {
    id: finding.id,
    topicKey,
    severity: finding.severity,
    confidence: finding.confidence,
    isCorrect: finding.isCorrect,
    original: finding.originalText,
    corrected: finding.correctedText,
    explanationRu: finding.explanationRu,
    scoreDelta: finding.scoreDelta,
    createdAt: finding.createdAt.toISOString()
  }
}

async function buildUserGrammarSkills(
  userId: string,
  scope: "weak" | "all"
): Promise<GrammarSkillsPayload> {
  const prisma = getPrisma()
  const topics = await prisma.grammarTopic.findMany({
    where: {
      isActive: true
    },
    orderBy: [{ cefrLevel: "asc" }, { category: "asc" }, { titleEn: "asc" }],
    include: {
      userSkills: {
        where: {
          userId
        },
        take: 1
      },
      findings: {
        where: {
          userId
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  })

  // Calculate 14 days trend
  const todayDate = new Date()
  const last14Start = new Date(todayDate.getTime() - 13 * 24 * 60 * 60 * 1000)
  
  const rawTrend = await prisma.$queryRaw<Array<{ date: string; value: bigint }>>(Prisma.sql`
    SELECT
      TO_CHAR(DATE("createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
      SUM("scoreDelta")::bigint AS value
    FROM "GrammarFinding"
    WHERE "userId" = ${userId}
      AND "createdAt" >= ${last14Start}
    GROUP BY 1
    ORDER BY 1 ASC
  `)

  const allItems = topics
    .map((topic) => {
      const skill = topic.userSkills[0]
      const score = skill?.score ?? 0
      const evidenceCount = skill?.evidenceCount ?? 0

      return {
        topic: serializeGrammarTopic(topic),
        score,
        scoreBand: getGrammarScoreBand(score, evidenceCount),
        evidenceCount,
        positiveEvidenceCount: skill?.positiveEvidenceCount ?? 0,
        negativeEvidenceCount: skill?.negativeEvidenceCount ?? 0,
        lastDetectedAt: skill?.lastDetectedAt?.toISOString() ?? null,
        latestFinding: topic.findings[0]
          ? serializeLatestGrammarFinding(topic.findings[0], topic.key)
          : null
      }
    })
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score
      }

      return left.topic.titleEn.localeCompare(right.topic.titleEn)
    })

  const weakItems = allItems.filter(
    (item) => item.score < WEAK_GRAMMAR_SCORE_THRESHOLD && item.evidenceCount > 0
  )

  const currentTotalScore = allItems.reduce((sum, item) => sum + item.score, 0)
  
  // Build a map of daily deltas
  const deltasMap = new Map(rawTrend.map(r => [r.date, Number(r.value)]))
  const trendDays: string[] = []
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000)
    trendDays.push(d.toISOString().slice(0, 10))
  }

  // Calculate the score 14 days ago by subtracting all deltas in the 14-day window from current total
  const sumInWindow = Array.from(deltasMap.values()).reduce((a, b) => a + b, 0)
  let cumulative = currentTotalScore - sumInWindow

  const trend = trendDays.map(dateStr => {
    cumulative += (deltasMap.get(dateStr) || 0)
    return {
      date: dateStr,
      value: cumulative
    }
  })

  return {
    items: scope === "weak" ? weakItems : allItems,
    weakCount: weakItems.length,
    trend
  }
}

export function getUserGrammarSkillsData(
  userId: string,
  scope: "weak" | "all" = "all"
): Promise<GrammarSkillsPayload> {
  return cacheUserResource(
    [`grammar-skills:${scope}:${userId}`],
    [userCacheTag.grammar(userId), userCacheTag.profile(userId), adminCacheTag.grammarTopics],
    () => buildUserGrammarSkills(userId, scope)
  )
}

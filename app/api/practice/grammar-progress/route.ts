import { NextRequest, NextResponse } from "next/server"
import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { userCacheTag } from "@/lib/server-cache"
import { revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { topicKey, scoreDelta, exerciseId, isCorrect } = body

  if (!topicKey) return NextResponse.json({ error: "Missing topicKey" }, { status: 400 })

  const prisma = getPrisma()
  
  // Find topic ID from key
  const topic = await prisma.grammarTopic.findUnique({
    where: { key: topicKey }
  })

  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 })

  await prisma.userGrammarSkill.upsert({
    where: { userId_topicId: { userId: user.id, topicId: topic.id } },
    create: {
      userId: user.id,
      topicId: topic.id,
      score: Math.max(-100, Math.min(100, scoreDelta)),
      evidenceCount: 1,
      positiveEvidenceCount: isCorrect ? 1 : 0,
      negativeEvidenceCount: isCorrect ? 0 : 1,
      lastDetectedAt: new Date()
    },
    update: {
      score: { increment: scoreDelta },
      evidenceCount: { increment: 1 },
      positiveEvidenceCount: { increment: isCorrect ? 1 : 0 },
      negativeEvidenceCount: { increment: isCorrect ? 0 : 1 },
      lastDetectedAt: new Date()
    }
  })

  // Create a log in GrammarFinding for the history
  await prisma.grammarFinding.create({
    data: {
      userId: user.id,
      topicId: topic.id,
      sourceType: "grammar_exercise",
      sourceId: sessionId || exerciseId || "unknown",
      originalText: "Grammar Exercise",
      correctedText: isCorrect ? "Correct answer" : "Incorrect answer",
      explanationRu: isCorrect ? "Пройдено упражнение (успешно)" : "Пройдено упражнение (с ошибкой)",
      severity: "low",
      confidence: 1.0,
      isCorrect: isCorrect,
      scoreDelta: scoreDelta
    }
  })

  // Clamp score
  await prisma.userGrammarSkill.updateMany({
    where: { userId: user.id, topicId: topic.id, score: { lt: -100 } },
    data: { score: -100 }
  })
  await prisma.userGrammarSkill.updateMany({
    where: { userId: user.id, topicId: topic.id, score: { gt: 100 } },
    data: { score: 100 }
  })

  revalidateTag(userCacheTag.grammar(user.id))

  return NextResponse.json({ success: true })
}

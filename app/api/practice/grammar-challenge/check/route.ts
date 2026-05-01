import { NextRequest, NextResponse } from "next/server"
import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { generateLexiAiText } from "@/lib/ai"
import { getActiveGrammarTopicsForAi, normalizeGrammarFindings, applyGrammarFindingsToWritingChallenge } from "@/lib/grammar"
import { checkRateLimit } from "@/lib/throttle"
import type { WritingTaskType, GrammarWritingFeedback, CefrLevel } from "@/lib/types"

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rateLimit = await checkRateLimit(`grammar-check:${user.id}`, 1, 2)
  if (!rateLimit.allowed) return NextResponse.json({ error: "Slow down." }, { status: 429 })

  const body = await request.json()
  const { userText, taskType, targetGrammarTopics, targetWords } = body

  if (!userText || userText.trim().split(/\s+/).filter(Boolean).length < 30) {
    return NextResponse.json({ error: "Text too short." }, { status: 400 })
  }

  const prisma = getPrisma()
  const activeTopics = await getActiveGrammarTopicsForAi(prisma)

  const prompt = `
    You are an expert English teacher. Evaluate the following writing task from a student.
    
    Student Text: "${userText}"
    Task Type: ${taskType}
    Target Grammar Topics: ${JSON.stringify(targetGrammarTopics)}
    Target Words: ${JSON.stringify(targetWords)}
    Student current level: ${user.cefrLevel}

    Provide feedback in Russian.
    Return ONLY valid JSON in this exact structure:
    {
      "type": "writing_feedback",
      "score": number (0-100),
      "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
      "summaryRu": "Short overview in Russian",
      "targetGrammarTopics": [
        {
          "topicKey": "string (from the list of keys provided in student context)",
          "status": "weak" | "neutral" | "strong",
          "scoreDelta": number (-10 to 10),
          "explanationRu": "Why this score"
        }
      ],
      "wordUsage": [
        {
          "word": "string",
          "status": "correct" | "incorrect" | "missing",
          "feedbackRu": "Feedback in Russian"
        }
      ],
      "mistakes": [
        {
          "type": "grammar" | "vocabulary" | "style",
          "topicKey": "string (optional matching topic key)",
          "original": "Incorrect fragment",
          "corrected": "Corrected fragment",
          "explanationRu": "Explanation in Russian",
          "severity": "low" | "medium" | "high"
        }
      ],
      "correctFragments": [
        {
          "text": "Correct fragment from student text",
          "reasonRu": "Why it is correct and good"
        }
      ],
      "nextSuggestionRu": "Practical advice for next time"
    }

    Active Grammar Topics Keys for reference:
    ${JSON.stringify(activeTopics.map(t => t.key))}

    Rules:
    - Return JSON only. No markdown.
    - Be strict but encouraging.
    - Ensure grammarFindings matches the keys provided.
  `

  let attempts = 0
  let resultText = ""
  while (attempts < 2) {
    const aiResult = await generateLexiAiText({
      prompt: attempts === 0 ? prompt : `Your previous response was not valid JSON. Please try again and return ONLY valid JSON: ${prompt}`,
      purpose: "grammar-writing-check",
      temperature: 0.2,
      responseMimeType: "application/json"
    })
    resultText = aiResult.text
    try {
      JSON.parse(resultText)
      break
    } catch (e) {
      attempts++
    }
  }

  try {
    const feedback = JSON.parse(resultText) as GrammarWritingFeedback
    
    // Save to DB and update skills
    await prisma.$transaction(async (tx) => {
      const challenge = await tx.practiceWritingChallenge.create({
        data: {
          userId: user.id,
          userText,
          score: feedback.score,
          levelFeedback: feedback.summaryRu,
          targetWords: targetWords || [],
          usedWords: (feedback.wordUsage || []) as any,
          grammarMistakes: feedback.mistakes as any,
          improvedText: "",
          nextTask: feedback.nextSuggestionRu,
          whatWasGood: feedback.correctFragments.map(f => f.text).join(". "),
          grammarFindings: feedback.targetGrammarTopics.map(t => ({
            topicKey: t.topicKey,
            scoreDelta: t.scoreDelta,
            isCorrect: t.scoreDelta >= 0,
            original: "",
            corrected: "",
            explanationRu: t.explanationRu,
            severity: t.scoreDelta < -5 ? "high" : t.scoreDelta < 0 ? "medium" : "low",
            confidence: 0.95
          })) as any
        }
      })

      // 1. Update Grammar Skills
      for (const topicImpact of feedback.targetGrammarTopics) {
        const topic = activeTopics.find(t => t.key === topicImpact.topicKey)
        if (!topic) continue

        await tx.userGrammarSkill.upsert({
          where: { userId_topicId: { userId: user.id, topicId: topic.id } },
          create: {
            userId: user.id,
            topicId: topic.id,
            score: Math.max(-100, Math.min(100, topicImpact.scoreDelta)),
            evidenceCount: 1,
            positiveEvidenceCount: topicImpact.scoreDelta >= 0 ? 1 : 0,
            negativeEvidenceCount: topicImpact.scoreDelta < 0 ? 1 : 0,
            lastDetectedAt: new Date()
          },
          update: {
            score: { increment: topicImpact.scoreDelta },
            evidenceCount: { increment: 1 },
            positiveEvidenceCount: { increment: topicImpact.scoreDelta >= 0 ? 1 : 0 },
            negativeEvidenceCount: { increment: topicImpact.scoreDelta < 0 ? 1 : 0 },
            lastDetectedAt: new Date()
          }
        })
      }

      // 2. Update Card Progress if words were used
      if (feedback.wordUsage && feedback.wordUsage.length > 0) {
        for (const usage of feedback.wordUsage) {
          if (usage.status === "missing") continue

          // Find the card for this user and word
          const card = await tx.card.findFirst({
            where: {
              userId: user.id,
              OR: [
                { original: { mode: "insensitive", equals: usage.word } },
                { catalogWord: { word: { mode: "insensitive", equals: usage.word } } }
              ]
            }
          })

          if (card) {
            const isCorrect = usage.status === "correct"
            const nextReviewDate = new Date()
            // Very simple SRS jump: +2 days if correct, +0 days if incorrect
            nextReviewDate.setDate(nextReviewDate.getDate() + (isCorrect ? 2 : 0))
            const dateKey = nextReviewDate.toISOString().slice(0, 10)

            await tx.card.update({
              where: { id: card.id },
              data: {
                correctCount: { increment: isCorrect ? 1 : 0 },
                wrongCount: { increment: isCorrect ? 0 : 1 },
                reviewCount: { increment: 1 },
                nextReviewDate: dateKey,
                lastReviewResult: isCorrect ? "known" : "unknown"
              }
            })
          }
        }
      }
      
      // Clamp scores
      await tx.userGrammarSkill.updateMany({
        where: { userId: user.id, score: { lt: -100 } },
        data: { score: -100 }
      })
      await tx.userGrammarSkill.updateMany({
        where: { userId: user.id, score: { gt: 100 } },
        data: { score: 100 }
      })
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("Failed to process AI check:", error)
    return NextResponse.json({ error: "Failed to process evaluation" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { generateLexiAiText } from "@/lib/ai"
import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/throttle"
import { 
  getActiveGrammarTopicsForAi, 
  normalizeGrammarFindings, 
  toClientGrammarFinding,
  applyGrammarFindingsToTranslationChallenge
} from "@/lib/grammar"
import { revalidateTag } from "next/cache"
import { userCacheTag } from "@/lib/server-cache"
import type { Prisma } from "@prisma/client"

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()
  if (!user) {
    console.error("[translation-challenge] No user found")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { action } = body
  console.log(`[translation-challenge] Action: ${action}, User: ${user.email}`)

  if (action === "generate") {
    return handleGenerate(user)
  }

  if (action === "check") {
    return handleCheck(user, body, request)
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

function extractJsonText(text: string) {
  let cleanedText = text.trim()
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonBlockMatch) {
    cleanedText = jsonBlockMatch[1].trim()
  }
  if (!cleanedText.startsWith("{")) {
    const jsonStart = cleanedText.indexOf("{")
    const jsonEnd = cleanedText.lastIndexOf("}")
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      cleanedText = cleanedText.slice(jsonStart, jsonEnd + 1)
    }
  }
  return cleanedText
}

async function handleGenerate(user: any) {
  try {
    const prisma = getPrisma()
    // Fetch some words user is currently learning to include them in the text
    const recentCards = await prisma.card.findMany({
      where: { userId: user.id },
      orderBy: { dateAdded: "desc" },
      take: 5,
      select: { original: true, translation: true }
    })

    const prompt = [
      "You are an English teacher for Russian speakers.",
      `The user has CEFR level: ${user.cefrLevel || "A1"}.`,
      recentCards.length > 0 ? `Try to incorporate themes related to these words if possible: ${recentCards.map(c => c.translation).join(", ")}.` : "",
      "Generate a short Russian text (1-3 sentences) for the user to translate into English.",
      "The text should be natural and appropriate for their level.",
      "Return ONLY JSON in this format:",
      '{ "russianText": "...", "suggestedWords": ["word1", "word2"] }'
    ].join("\n")

    const result = await generateLexiAiText({
      prompt,
      purpose: "translation-challenge-gen",
      temperature: 0.7
    })

    if (!result) {
      console.error("[translation-challenge-gen] AI failed to generate task (result is null)")
      return NextResponse.json({ error: "AI failed to generate task (null)" }, { status: 500 })
    }

    try {
      const cleanedText = extractJsonText(result.text)
      const parsed = JSON.parse(cleanedText)
      
      if (!parsed.russianText) {
        throw new Error("AI response missing russianText")
      }

      return NextResponse.json(parsed)
    } catch (err) {
      console.error("[translation-challenge-gen] JSON parse failed:", err, result.text)
      return NextResponse.json({ 
        error: "Failed to parse AI response",
        debug: result.text.slice(0, 100) 
      }, { status: 500 })
    }
  } catch (err: any) {
    console.error("[translation-challenge-gen] Fatal error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

async function handleCheck(user: any, body: any, request: NextRequest) {
  try {
    const { russianText, userTranslation } = body
    if (!russianText || !userTranslation) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const rateLimit = await checkRateLimit(`translation-check:${user.id}`, 1, 2)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Slow down" }, { status: 429 })
    }

    const prisma = getPrisma()
    const activeGrammarTopics = await getActiveGrammarTopicsForAi(prisma)

    const prompt = [
      "You are an English coach.",
      "User translated this Russian text into English.",
      `Original Russian: ${russianText}`,
      `User Translation: ${userTranslation}`,
      "",
      "Task:",
      "1. Rate the translation from 0 to 100.",
      "2. Provide feedback in Russian.",
      "3. Provide the most natural English version.",
      "4. List specific grammar/vocabulary mistakes.",
      "5. Use active grammar topics for tracking.",
      "6. For grammarFindings, use ONLY the active grammar topic keys listed below.",
      "7. Include grammarFindings for both mistakes (isCorrect: false) and topics the user used correctly (isCorrect: true).",
      "8. For correct usage, original and corrected should be identical, and severity is always 'low'.",
      "9. If no listed grammar topic clearly matches, return an empty grammarFindings array.",
      "",
      "Active Grammar topics:",
      JSON.stringify(activeGrammarTopics.map(t => ({ key: t.key, title: t.titleEn })), null, 2),
      "",
      "Return ONLY JSON in this format:",
      "{",
      '  "score": number,',
      '  "feedbackRu": "string",',
      '  "correctedEnglishText": "string",',
      '  "mistakes": [{ "original": "...", "corrected": "...", "explanationRu": "...", "severity": "low|medium|high" }],',
      '  "grammarFindings": [',
      '    {',
      '      "topicKey": "string",',
      '      "severity": "low|medium|high",',
      '      "confidence": 0.9,',
      '      "isCorrect": true,',
      '      "original": "string",',
      '      "corrected": "string",',
      '      "explanationRu": "string"',
      '    }',
      '  ]',
      "}"
    ].join("\n")

    const result = await generateLexiAiText({
      prompt,
      purpose: "translation-challenge-check",
      temperature: 0.2
    })

    if (!result) {
      console.error("[translation-challenge-check] AI failed to check translation (null)")
      return NextResponse.json({ error: "AI failed to check translation (null)" }, { status: 500 })
    }

    try {
      const cleanedText = extractJsonText(result.text)
      const parsed = JSON.parse(cleanedText)
      
      const score = typeof parsed.score === "number" ? Math.round(parsed.score) : parseInt(String(parsed.score)) || 0
      const mistakes = Array.isArray(parsed.mistakes) ? parsed.mistakes : []
      const grammarFindingsRaw = Array.isArray(parsed.grammarFindings) ? parsed.grammarFindings : []

      const normalizedGrammarFindings = normalizeGrammarFindings(grammarFindingsRaw, activeGrammarTopics)
      
      const saved = await prisma.$transaction(async (tx) => {
        const challenge = await tx.practiceTranslationChallenge.create({
          data: {
            userId: user.id,
            russianText,
            userTranslation,
            score: Math.max(0, Math.min(100, score)),
            feedbackRu: String(parsed.feedbackRu || ""),
            correctedEnglishText: String(parsed.correctedEnglishText || ""),
            mistakes: mistakes as any,
            grammarFindings: grammarFindingsRaw as any
          }
        })

        const appliedGrammarFindings = await applyGrammarFindingsToTranslationChallenge(tx, {
          userId: user.id,
          challengeId: challenge.id,
          findings: normalizedGrammarFindings
        })

        return {
          id: challenge.id,
          appliedGrammarFindings
        }
      }, { timeout: 20000, maxWait: 20000 })

      revalidateTag(userCacheTag.grammar(user.id))
      revalidateTag(userCacheTag.profile(user.id))

      return NextResponse.json({
        ...parsed,
        score: Math.max(0, Math.min(100, score)),
        id: saved.id,
        grammarFindings: saved.appliedGrammarFindings
      })
    } catch (err) {
      console.error("[translation-challenge-check] AI JSON or DB error:", err, result.text)
      return NextResponse.json({ 
        error: "Failed to process translation result",
        debug: String(err)
      }, { status: 500 })
    }
  } catch (err: any) {
    console.error("[translation-challenge-check] Fatal error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

import { PrismaClient } from "@prisma/client"
import { buildQuizPrompt, parseAIBlockFromText } from "./lib/ai-blocks"
import { generateLexiAiText } from "./lib/ai"

const prisma = new PrismaClient()

async function test() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: [
        { lastReviewResult: "desc" },
        { nextReviewDate: "asc" }
      ],
      take: 8,
      include: { catalogWord: true }
    })

    const targetWords = cards
      .map((c) => ({
        word: c.original || c.catalogWord?.word,
        translation: c.translation || c.catalogWord?.translation,
        level: c.catalogWord?.cefrLevel ?? undefined
      }))
      .filter((c) => Boolean(c.word && c.translation))

    console.log("Target words extracted:", targetWords.length)

    const prompt = buildQuizPrompt(targetWords)
    console.log("Prompt generated...")

    const result = await generateLexiAiText({
      prompt,
      purpose: "ai-chat",
      temperature: 0.35,
      maxOutputTokens: 1200
    })

    const rawReply = result?.text
    console.log("Raw reply:", rawReply)

    const parseResult = parseAIBlockFromText(rawReply || "")
    if (!parseResult.ok) {
      console.log("PARSE ERROR:", parseResult.error)
    } else {
      console.log("SUCCESS!")
    }
  } catch (e) {
    console.error("Script error:", e)
  }
}

test()

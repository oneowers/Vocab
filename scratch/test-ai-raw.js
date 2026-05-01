require("dotenv").config({ path: ".env.local" })
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

function buildQuizPrompt(targetWords) {
  const targetWordsText = targetWords
    .map((w) => `- ${w.word} = ${w.translation} (${w.level ?? "unknown"})`)
    .join("\n")

  return `You are a vocabulary quiz generator.
Return only valid raw JSON. No markdown. No code fences. No explanations before or after the JSON.

Create a vocabulary quiz using the target words listed below.

Required JSON structure (return this exact format):
{
  "type": "quiz",
  "title": "Vocabulary Quiz",
  "mode": "vocabulary",
  "direction": "en-ru",
  "items": [
    {
      "id": "q1",
      "word": "enjoy",
      "translation": "наслаждаться",
      "level": "A1",
      "question": "What is the best Russian translation of \\"enjoy\\"?",
      "options": [
        { "id": "a", "text": "наслаждаться", "isCorrect": true, "feedback": "Correct. \\"Enjoy\\" means \\"наслаждаться\\". Example: I enjoy music." },
        { "id": "b", "text": "применять", "isCorrect": false, "feedback": "Not quite. \\"Применять\\" means \\"apply\\"." },
        { "id": "c", "text": "правительство", "isCorrect": false, "feedback": "Not quite. \\"Правительство\\" means \\"government\\"." }
      ]
    }
  ]
}

Rules:
- Create exactly one quiz item per target word.
- Use 3 or 4 answer options per item.
- Exactly one option must have isCorrect: true.
- All other options must have isCorrect: false.
- isCorrect must be a boolean, not a string.
- Every option must have a non-empty "text" field (Russian translation).
- Every option must have a non-empty "feedback" field.
- Use the correct Russian translation as the right answer.
- Use other target words as plausible distractors.
- Keep questions short and clear.
- Keep feedback short and educational.
- Do NOT wrap the JSON in markdown or code fences.
- Return ONLY the JSON object. Nothing else.

Target words:
${targetWordsText}`
}

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
    
    const apiKey = (process.env.GEMINI_API_KEY || "").replace(/"/g, '')
    let model = (process.env.GEMINI_MODEL || "gemini-1.5-flash").replace(/"/g, '')
    model = model.replace(/^models\//, '')
    
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [ { role: "user", parts: [{ text: prompt }] } ],
          generationConfig: { temperature: 0.35, maxOutputTokens: 1200 }
        })
      }
    )

    const payload = await response.json()
    console.log("=== API PAYLOAD ===")
    console.log(JSON.stringify(payload, null, 2))
    
    const text = payload?.candidates
      ?.flatMap((c) => c.content?.parts ?? [])
      .map((p) => p.text?.trim())
      .filter(Boolean)
      .join("")

    const rawReply = text || ""
    console.log("========== RAW REPLY ==========")
    console.log(rawReply)
    console.log("===============================")
    
    // Try to parse it manually to see the error
    let cleaned = rawReply.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim()
    
    let extracted = cleaned
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start !== -1 && end !== -1 && end > start) {
      extracted = cleaned.slice(start, end + 1)
    }

    try {
      JSON.parse(extracted)
      console.log("Parsed successfully!")
    } catch (e) {
      console.log("JSON Parse Error:", e.message)
    }

  } catch (e) {
    console.error("Script error:", e)
  } finally {
    await prisma.$disconnect()
  }
}

test()

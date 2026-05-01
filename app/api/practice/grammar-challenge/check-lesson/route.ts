import { NextRequest, NextResponse } from "next/server"
import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { generateLexiAiText } from "@/lib/ai"
import { checkRateLimit } from "@/lib/throttle"

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rateLimit = await checkRateLimit(`grammar-check-lesson:${user.id}`, 1, 2)
  if (!rateLimit.allowed) return NextResponse.json({ error: "Slow down." }, { status: 429 })

  const body = await request.json()
  const { userText, topicKey, prompt: taskPrompt } = body

  if (!userText || !topicKey) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 })
  }

  const aiPrompt = `
    You are an English teacher. Evaluate the following writing task focused on a specific grammar topic.
    
    Topic: ${topicKey.replaceAll("_", " ")}
    Task: "${taskPrompt}"
    Student Text: "${userText}"
    Student current level: ${user.cefrLevel}

    Provide feedback in Russian.
    Focus strictly on whether the student used the target grammar correctly.
    
    Return ONLY valid JSON:
    {
      "type": "grammar_writing_feedback",
      "topicKey": "${topicKey}",
      "score": number (0-100),
      "status": "good" | "needs_work",
      "summaryRu": "Short overview in Russian",
      "mistakes": [
        {
          "original": "Incorrect fragment",
          "corrected": "Corrected fragment",
          "explanationRu": "Explanation in Russian",
          "severity": "low" | "medium" | "high",
          "scoreDelta": number (negative)
        }
      ],
      "correctFragments": [
        {
          "text": "Correct fragment from student text",
          "reasonRu": "Why it is correct and good usage of ${topicKey}"
        }
      ],
      "nextSuggestionRu": "Practical advice for next time"
    }
  `

  const result = await generateLexiAiText({
    prompt: aiPrompt,
    purpose: "grammar-lesson-check",
    temperature: 0.2,
    responseMimeType: "application/json"
  })

  if (!result || !result.text) {
    return NextResponse.json({ error: "Failed to generate evaluation" }, { status: 500 })
  }

  try {
    const feedback = JSON.parse(result.text)
    return NextResponse.json({ feedback })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process evaluation" }, { status: 500 })
  }
}

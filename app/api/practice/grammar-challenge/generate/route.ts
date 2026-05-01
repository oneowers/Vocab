import { NextRequest, NextResponse } from "next/server"
import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { generateLexiAiText } from "@/lib/ai"
import { getUserGrammarSkillsData } from "@/lib/grammar"
import type { WritingTaskType } from "@/lib/types"

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const taskType = body.taskType as WritingTaskType

  const prisma = getPrisma()
  
  // Fetch weak topics
  const grammarData = await getUserGrammarSkillsData(user.id, "weak")
  const weakTopics = grammarData.items.map(item => ({
    key: item.topic.key,
    title: item.topic.titleEn,
    description: item.topic.description
  }))

  // Optionally fetch some words if needed for certain task types
  let targetWords: string[] = []
  if (["words_in_sentences", "answer_question", "story_mode"].includes(taskType)) {
    const cards = await prisma.card.findMany({
      where: { userId: user.id },
      take: 5,
      orderBy: { nextReviewDate: "asc" },
      select: { original: true }
    })
    targetWords = cards.map(c => c.original)
  }

  const prompt = `
    You are an English coach. Generate a writing task for an English learner.
    
    Task Type: ${taskType}
    User CEFR Level: ${user.cefrLevel}
    Weak Grammar Topics: ${JSON.stringify(weakTopics)}
    Target Vocabulary (optional): ${JSON.stringify(targetWords)}
    
    Task requirements:
    - title: Catchy and short
    - prompt: Clear instructions in English on what to write (about 2-3 sentences)
    - targetGrammarTopics: Array of keys from the weak topics provided, or general topics if none provided.
    - targetWords: Array of words to use (if task type requires it)

    Return valid JSON only:
    {
      "task": {
        "title": "string",
        "prompt": "string",
        "targetGrammarTopics": ["string"],
        "targetWords": ["string"]
      }
    }
  `

  const result = await generateLexiAiText({
    prompt,
    purpose: "grammar-task-generation",
    temperature: 0.7,
    responseMimeType: "application/json"
  })

  try {
    const data = JSON.parse(result.text)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
  }
}

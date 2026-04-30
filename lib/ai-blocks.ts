/**
 * LexiFlow AI Blocks Architecture
 * --------------------------------
 * AI generates only structured data.
 * Backend validates and normalises.
 * Frontend renders predefined components.
 */

// ============================================================
// MESSAGE MODEL
// ============================================================

export type ChatMessage =
  | { id: string; role: "user"; kind: "text"; content: string; createdAt: string }
  | { id: string; role: "assistant"; kind: "text"; content: string; createdAt: string }
  | { id: string; role: "assistant"; kind: "block"; block: AIBlock; createdAt: string }
  | { id: string; role: "assistant"; kind: "error"; content: string; createdAt: string }

// ============================================================
// AI BLOCK UNION
// ============================================================

export type AIBlock =
  | QuizBlock
  | FlashcardBlock
  | StudyPlanBlock
  | ExampleSentencesBlock
  | GrammarFeedbackBlock

// ============================================================
// QUIZ BLOCK
// ============================================================

export type QuizOption = {
  id: string
  text: string
  isCorrect: boolean
  feedback: string
}

export type QuizItem = {
  id: string
  word: string
  translation?: string
  level?: string
  question: string
  options: QuizOption[]
}

export type QuizBlock = {
  type: "quiz"
  title: string
  mode: "vocabulary" | "grammar" | "mixed"
  direction?: "en-ru" | "ru-en" | "en-en"
  items: QuizItem[]
}

// ============================================================
// STUB BLOCK TYPES (ready for future implementation)
// ============================================================

export type FlashcardBlock = {
  type: "flashcard"
  items: { word: string; translation: string; example?: string }[]
}

export type StudyPlanBlock = {
  type: "study_plan"
  title: string
  days: { day: number; tasks: string[] }[]
}

export type ExampleSentencesBlock = {
  type: "examples"
  word: string
  sentences: { text: string; translation: string }[]
}

export type GrammarFeedbackBlock = {
  type: "grammar_feedback"
  original: string
  corrected: string
  explanation: string
}

// ============================================================
// TARGET WORD FOR QUIZ GENERATION
// ============================================================

export type TargetWord = {
  word: string
  translation: string
  level?: string
}

// ============================================================
// AI RESPONSE CLEANING
// ============================================================

export function cleanAIJsonResponse(content: string): string {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
}

/**
 * Tries to extract the first valid JSON object from a string.
 * Handles cases where the AI adds text before/after JSON.
 */
export function extractJsonFromText(text: string): string | null {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  return text.slice(start, end + 1)
}

// ============================================================
// VALIDATION
// ============================================================

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function validateQuizOption(opt: unknown, idx: number): ValidationResult<QuizOption> {
  if (!opt || typeof opt !== "object") {
    return { ok: false, error: `Option ${idx} is not an object` }
  }
  const o = opt as Record<string, unknown>

  // Support multiple possible text fields for robustness
  const text = String(o.text ?? o.label ?? o.value ?? o.answer ?? "").trim()
  if (!text) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[AI Blocks] Option ${idx} has no visible text`, o)
    }
    return { ok: false, error: `Option ${idx} is missing text` }
  }
  if (typeof o.feedback !== "string" || !o.feedback.trim()) {
    return { ok: false, error: `Option ${idx} is missing feedback` }
  }

  return {
    ok: true,
    data: {
      id: String(o.id ?? idx),
      text,
      isCorrect: o.isCorrect === true || o.isCorrect === "true",
      feedback: String(o.feedback).trim()
    }
  }
}

function validateQuizItem(item: unknown, idx: number): ValidationResult<QuizItem> {
  if (!item || typeof item !== "object") {
    return { ok: false, error: `Item ${idx} is not an object` }
  }
  const it = item as Record<string, unknown>

  const word = String(it.word ?? "").trim()
  if (!word) return { ok: false, error: `Item ${idx} is missing word` }

  const question = String(it.question ?? "").trim()
  if (!question) return { ok: false, error: `Item ${idx} is missing question` }

  if (!Array.isArray(it.options) || it.options.length < 2) {
    return { ok: false, error: `Item ${idx} needs at least 2 options` }
  }

  const options: QuizOption[] = []
  for (let i = 0; i < it.options.length; i++) {
    const result = validateQuizOption(it.options[i], i)
    if (!result.ok) return { ok: false, error: `Item ${idx}, ${result.error}` }
    options.push(result.data)
  }

  const correctCount = options.filter((o) => o.isCorrect).length
  if (correctCount === 0) {
    return { ok: false, error: `Item ${idx} has no correct answer` }
  }
  if (correctCount > 1) {
    return { ok: false, error: `Item ${idx} has multiple correct answers` }
  }

  return {
    ok: true,
    data: {
      id: String(it.id ?? `q${idx + 1}`),
      word,
      translation: it.translation ? String(it.translation) : undefined,
      level: it.level ? String(it.level) : undefined,
      question,
      options
    }
  }
}

export function validateQuizBlock(data: unknown): ValidationResult<QuizBlock> {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Data is not an object" }
  }
  const d = data as Record<string, unknown>

  if (d.type !== "quiz") {
    return { ok: false, error: `Expected type "quiz", got "${d.type}"` }
  }
  if (!Array.isArray(d.items) || (d.items as unknown[]).length === 0) {
    return { ok: false, error: "Quiz has no items" }
  }
  if ((d.items as unknown[]).length > 10) {
    ;(d as Record<string, unknown>).items = (d.items as unknown[]).slice(0, 10)
  }

  const items: QuizItem[] = []
  for (let i = 0; i < (d.items as unknown[]).length; i++) {
    const result = validateQuizItem((d.items as unknown[])[i], i)
    if (!result.ok) return { ok: false, error: result.error }
    items.push(result.data)
  }

  // Deduplicate by word
  const seen = new Set<string>()
  const dedupedItems = items.filter((item) => {
    if (seen.has(item.word.toLowerCase())) return false
    seen.add(item.word.toLowerCase())
    return true
  })

  const validModes = ["vocabulary", "grammar", "mixed"]
  const mode = validModes.includes(String(d.mode)) ? (d.mode as QuizBlock["mode"]) : "vocabulary"
  const validDirections = ["en-ru", "ru-en", "en-en"]
  const direction = validDirections.includes(String(d.direction))
    ? (d.direction as QuizBlock["direction"])
    : "en-ru"

  return {
    ok: true,
    data: {
      type: "quiz",
      title: String(d.title ?? "Vocabulary Quiz").trim() || "Vocabulary Quiz",
      mode,
      direction,
      items: dedupedItems
    }
  }
}

export function validateAIBlock(data: unknown): ValidationResult<AIBlock> {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Not an object" }
  }
  const d = data as Record<string, unknown>

  switch (d.type) {
    case "quiz":
      return validateQuizBlock(data)
    case "flashcard":
    case "study_plan":
    case "examples":
    case "grammar_feedback":
      return { ok: false, error: `Block type "${d.type}" is not yet implemented` }
    default:
      return { ok: false, error: `Unknown block type: "${d.type}"` }
  }
}

// ============================================================
// PARSING PIPELINE
// ============================================================

export type ParseBlockResult =
  | { ok: true; block: AIBlock }
  | { ok: false; error: string }

export function parseAIBlockFromText(content: string): ParseBlockResult {
  // Step 1: Clean markdown fences
  const cleaned = cleanAIJsonResponse(content)

  // Step 2: Try direct parse
  let rawData: unknown = null
  try {
    rawData = JSON.parse(cleaned)
  } catch {
    // Step 3: Try extracting JSON from mixed text
    const extracted = extractJsonFromText(cleaned)
    if (extracted) {
      try {
        rawData = JSON.parse(extracted)
      } catch {
        return { ok: false, error: "Could not parse JSON from AI response" }
      }
    } else {
      return { ok: false, error: "No JSON object found in AI response" }
    }
  }

  // Step 4: Validate schema
  const result = validateAIBlock(rawData)
  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  return { ok: true, block: result.data }
}

/**
 * Quick check: does this text look like it could be a structured block?
 * Used to decide whether to try parsing before rendering as markdown.
 */
export function looksLikeAIBlock(content: string): boolean {
  const t = content.trim()
  return (
    (t.startsWith("{") || t.includes("```json")) &&
    (t.includes('"type"') || t.includes("\"type\""))
  )
}

// ============================================================
// PROMPT BUILDERS
// ============================================================

export function buildQuizPrompt(targetWords: TargetWord[]): string {
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

export function buildQuizRepairPrompt(
  targetWords: TargetWord[],
  validationError: string
): string {
  const targetWordsText = targetWords
    .map((w) => `- ${w.word} = ${w.translation} (${w.level ?? "unknown"})`)
    .join("\n")

  return `Your previous response was invalid.

Validation error: ${validationError}

Fix the error and return corrected valid JSON only.
Do not add explanations. Do not use markdown. Do not use code fences.

Required structure:
{
  "type": "quiz",
  "title": "Vocabulary Quiz",
  "mode": "vocabulary",
  "direction": "en-ru",
  "items": [
    {
      "id": "q1",
      "word": "...",
      "translation": "...",
      "level": "...",
      "question": "...",
      "options": [
        { "id": "a", "text": "...", "isCorrect": true, "feedback": "..." },
        { "id": "b", "text": "...", "isCorrect": false, "feedback": "..." },
        { "id": "c", "text": "...", "isCorrect": false, "feedback": "..." }
      ]
    }
  ]
}

Rules:
- isCorrect must be boolean true or false, not strings.
- Exactly one option per item must be isCorrect: true.
- Every option must have non-empty text and feedback.
- Return ONLY the JSON object.

Target words:
${targetWordsText}`
}

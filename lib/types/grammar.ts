import type { CefrLevel, GrammarSeverity, GrammarScoreBand } from "./common"

export interface GrammarTopicRecord {
  id: string
  key: string
  titleEn: string
  titleRu: string
  category: string
  cefrLevel: CefrLevel
  description: string
  formulas?: any
  usage?: any
  examples: any
  commonMistakes?: any
  exercises?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GrammarFindingRecord {
  id: string
  topicKey: string
  severity: GrammarSeverity
  confidence: number
  isCorrect: boolean
  original: string
  corrected: string
  explanationRu: string
  scoreDelta: number
  createdAt: string
  topicTitleEn?: string
  sourceType?: string
  sourceId?: string | null
}

export interface GrammarSkillRecord {
  topic: GrammarTopicRecord
  score: number
  scoreBand: GrammarScoreBand
  evidenceCount: number
  positiveEvidenceCount: number
  negativeEvidenceCount: number
  lastDetectedAt: string | null
  latestFinding: GrammarFindingRecord | null
}

export interface GrammarSkillsPayload {
  items: GrammarSkillRecord[]
  weakCount: number
  trend: Array<{ date: string; value: number }>
}

export interface GrammarWritingFeedback {
  type: "writing_feedback"
  score: number
  cefrLevel: CefrLevel
  summaryRu: string
  targetGrammarTopics: Array<{
    topicKey: string
    status: "weak" | "neutral" | "strong"
    scoreDelta: number
    explanationRu: string
  }>
  wordUsage?: Array<{
    word: string
    status: "correct" | "incorrect" | "missing"
    feedbackRu: string
  }>
  mistakes: Array<{
    type: "grammar" | "vocabulary" | "style"
    topicKey?: string
    original: string
    corrected: string
    explanationRu: string
    severity: GrammarSeverity
  }>
  correctFragments: Array<{
    text: string
    reasonRu: string
  }>
  nextSuggestionRu: string
}

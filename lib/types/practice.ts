import type { CefrLevel, GrammarSeverity } from "./common"
import type { GrammarFindingRecord } from "./grammar"
import type { AppSettingsRecord } from "./admin"
import type { GrammarSummaryPayload } from "./grammar"
import type { ReviewSummaryPayload } from "./cards"

// ─── Writing Challenge ────────────────────────────────────────────────────────

export type WritingTaskType =
  | "words_in_sentences"
  | "short_paragraph"
  | "answer_question"
  | "rewrite_sentences"
  | "ielts_mini"
  | "story_mode"
  | "grammar_focused"

export interface PracticeWritingTargetWord {
  word: string
  translation: string
  cefrLevel: CefrLevel | null
}

export interface PracticeWritingUsedWord {
  word: string
  used: boolean
  correct: boolean
  feedback: string
}

export interface PracticeWritingGrammarMistake {
  original: string
  corrected: string
  explanationRu: string
}

export interface PracticeWritingGrammarFinding {
  topicKey: string
  severity: GrammarSeverity
  confidence: number
  isCorrect?: boolean
  original: string
  corrected: string
  explanationRu: string
}

export interface PracticeWritingChallengeResult {
  id?: string
  score: number
  levelFeedback: string
  usedWords: PracticeWritingUsedWord[]
  grammarMistakes: PracticeWritingGrammarMistake[]
  grammarFindings: PracticeWritingGrammarFinding[]
  whatWasGood: string
  improvedText: string
  nextTask: string
}

// ─── Translation Challenge ────────────────────────────────────────────────────

export interface TranslationChallengeTask {
  russianText: string
  suggestedWords?: string[]
}

export interface TranslationChallengeResult {
  score: number
  feedbackRu: string
  correctedEnglishText: string
  mistakes: Array<{
    original: string
    corrected: string
    explanationRu: string
    severity: GrammarSeverity
  }>
  grammarFindings: PracticeWritingGrammarFinding[]
}

export interface PracticeEntryPayload {
  reviewSummary: ReviewSummaryPayload
  grammarSummary: GrammarSummaryPayload
  historyPreview: GrammarFindingRecord[]
  appSettings: AppSettingsRecord
}

import type {
  CefrLevel,
  CatalogEnrichmentStatus,
  CatalogReviewStatus,
  TranslationProvider,
  TranslationEngine,
  TranslationSource,
} from "./common"

export interface WordCatalogRecord {
  id: string
  word: string
  translation: string
  translationAlternatives: string[]
  cefrLevel: CefrLevel
  partOfSpeech: string
  topic: string
  example: string
  phonetic: string
  priority: number
  isPublished: boolean
  source: string | null
  sourceRef: string | null
  enrichmentStatus: CatalogEnrichmentStatus
  reviewStatus: CatalogReviewStatus
  lastEnrichedAt: string | null
  enrichmentError: string | null
  createdAt: string
  updatedAt: string
}

export interface DailyWordCandidate {
  id: string
  word: string
  translation: string
  example: string | null
  cefrLevel: CefrLevel
}

export interface DailyWordsPreviewPayload {
  items: DailyWordCandidate[]
  dailyTarget: number
  todayCount: number
  savedCount: number
  waitingCount: number
  claimedToday: number
  dailyLimit: number
  remainingToday: number
  limitReached: boolean
}

export interface TranslationPayload {
  translation: string
  translationAlternatives: string[]
  cefrLevel: CefrLevel | null
  source: TranslationSource
  cefrProfilerEnabled: boolean
}

export interface DictionaryPayload {
  example: string | null
  phonetic: string | null
  synonyms: Array<{
    word: string
    cefrLevel: CefrLevel | null
  }>
}

export interface ImportedDatasetWord {
  sourceId: string
  word: string
  cefrLevel: CefrLevel
  partOfSpeech: string
  priority: number
}

export interface EnrichmentResult {
  translation: string
  translationAlternatives: string[]
  example: string
  phonetic: string
  status: CatalogEnrichmentStatus
  error: string | null
}

// ─── CEFR Profiler ───────────────────────────────────────────────────────────

import type { CefrProfileBand } from "./common"

export interface CefrProfileWord {
  word: string
  occurrences: number
}

export interface CefrProfileSegment {
  text: string
  level: CefrProfileBand | null
}

export interface CefrProfileBucket {
  level: CefrProfileBand
  percentage: number
  words: CefrProfileWord[]
}

export interface CefrProfilePayload {
  totalWordCount: number
  segments: CefrProfileSegment[]
  buckets: CefrProfileBucket[]
}

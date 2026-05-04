// ─── Shared primitive types used across multiple domains ─────────────────────

import type { LucideIcon } from "lucide-react"

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
export type CefrProfileBand = CefrLevel | "Off-List"

export type Direction = "en-ru" | "ru-en"
export type ReviewResult = "known" | "unknown"
export type GrammarSeverity = "low" | "medium" | "high"
export type GrammarFindingSourceType = "writing_challenge"
export type GrammarScoreBand = "unknown" | "minor" | "weak" | "serious" | "critical" | "strong"

export type TranslationProvider = "auto" | "catalog-only"
export type TranslationEngine = "catalog" | "deepl" | "langeek"
export type TranslationSource = TranslationEngine

export type CardStatusFilter = "All" | "known" | "unknown" | "Waiting" | "Learned"
export type CatalogEnrichmentStatus = "pending" | "completed" | "failed"
export type CatalogReviewStatus = "draft" | "approved"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  id?: string
  match?: (pathname: string) => boolean
}

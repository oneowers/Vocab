// ─── Shared primitive types used across multiple domains ─────────────────────

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
export type CefrProfileBand = CefrLevel | "Off-List"

export type Direction = "en-ru" | "ru-en"
export type ReviewResult = "known" | "unknown"
export type GrammarSeverity = "low" | "medium" | "high"
export type TranslationProvider = "auto" | "catalog-only"
export type TranslationEngine = "catalog" | "deepl" | "langeek"
export type TranslationSource = TranslationEngine

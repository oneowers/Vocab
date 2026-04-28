import type { CefrProfileBand, CefrProfileBucket, CefrProfilePayload } from "@/lib/types"

const PROFILE_LEVELS: CefrProfileBand[] = ["A1", "A2", "B1", "B2", "C1", "C2", "Off-List"]

interface VocabKitchenRow {
  occurrences?: number
  rowHtml?: string
}

interface VocabKitchenBucket {
  percentage?: string
  rows?: VocabKitchenRow[]
}

interface VocabKitchenResponse {
  totalWordCount?: number
  paragraphHtml?: string
  tableResult?: Partial<Record<CefrProfileBand, VocabKitchenBucket>>
}

function extractText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function normalizePercentage(value: string | undefined) {
  const numeric = Number((value ?? "0").replace("%", "").trim())
  return Number.isFinite(numeric) ? numeric : 0
}

function normalizeBucket(level: CefrProfileBand, bucket?: VocabKitchenBucket): CefrProfileBucket {
  return {
    level,
    percentage: normalizePercentage(bucket?.percentage),
    words: (bucket?.rows ?? [])
      .map((row) => ({
        word: extractText(row.rowHtml ?? ""),
        occurrences: typeof row.occurrences === "number" ? row.occurrences : 0
      }))
      .filter((row) => row.word)
  }
}

function parseParagraphSegments(html: string) {
  const segments: CefrProfilePayload["segments"] = []
  const regex = /<span class=['"]profiler([^'"]+?)(?:Word)?['"]>(.*?)<\/span>|([^<]+)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    if (match[1] && match[2]) {
      const rawLevel = match[1].trim()
      const level =
        rawLevel === "OffList" || rawLevel === "Off-List"
          ? "Off-List"
          : (rawLevel as CefrProfileBand)
      segments.push({
        text: extractText(match[2]),
        level
      })
      continue
    }

    if (match[3]) {
      segments.push({
        text: match[3],
        level: null
      })
    }
  }

  return segments.filter((segment) => segment.text)
}

export async function fetchCefrProfile(inputText: string): Promise<CefrProfilePayload | null> {
  const response = await fetch("https://www.vocabkitchen.com/profiler", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ProfilerType: "cefr",
      InputText: inputText
    }),
    cache: "no-store"
  }).catch(() => null)

  if (!response?.ok) {
    return null
  }

  const payload = (await response.json().catch(() => null)) as VocabKitchenResponse | null

  if (!payload || typeof payload.totalWordCount !== "number") {
    return null
  }

  return {
    totalWordCount: payload.totalWordCount,
    segments: parseParagraphSegments(payload.paragraphHtml ?? inputText),
    buckets: PROFILE_LEVELS.map((level) => normalizeBucket(level, payload.tableResult?.[level]))
  }
}

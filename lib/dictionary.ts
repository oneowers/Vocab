interface DictionaryEntry {
  phonetic?: string
  phonetics?: Array<{ text?: string }>
  meanings?: Array<{
    synonyms?: string[]
    definitions?: Array<{
      example?: string
      synonyms?: string[]
    }>
  }>
}

function normalizeTerms(terms: string[]) {
  const seen = new Set<string>()

  return terms
    .map((term) => term.trim())
    .filter((term) => {
      const key = term.toLowerCase()

      if (!term || seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

export async function fetchDictionaryDetails(word: string) {
  const normalizedWord = word.trim()

  if (!normalizedWord) {
    return {
      example: null,
      phonetic: null,
      synonyms: []
    }
  }

  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`,
    {
      cache: "no-store"
    }
  )

  if (!response.ok) {
    return {
      example: null,
      phonetic: null,
      synonyms: []
    }
  }

  const payload = (await response.json()) as DictionaryEntry[]
  const firstEntry = payload[0]
  const example =
    firstEntry?.meanings
      ?.flatMap((meaning) => meaning.definitions ?? [])
      .find((definition) => typeof definition.example === "string")?.example ?? null
  const phonetic =
    firstEntry?.phonetic ||
    firstEntry?.phonetics?.find((item) => typeof item.text === "string")?.text ||
    null
  const synonyms = normalizeTerms(
    firstEntry?.meanings?.flatMap((meaning) => [
      ...(meaning.synonyms ?? []),
      ...(meaning.definitions?.flatMap((definition) => definition.synonyms ?? []) ?? [])
    ]) ?? []
  )

  return {
    example,
    phonetic,
    synonyms
  }
}

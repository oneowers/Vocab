interface DictionaryEntry {
  phonetic?: string
  phonetics?: Array<{ text?: string }>
  meanings?: Array<{
    definitions?: Array<{
      example?: string
    }>
  }>
}

export async function fetchDictionaryDetails(word: string) {
  const normalizedWord = word.trim()

  if (!normalizedWord) {
    return {
      example: null,
      phonetic: null
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
      phonetic: null
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

  return {
    example,
    phonetic
  }
}

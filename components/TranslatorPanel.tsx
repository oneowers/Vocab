"use client"

import { useState } from "react"
import { ArrowLeftRight, SlidersHorizontal, Volume2 } from "lucide-react"

import { useToast } from "@/components/Toast"
import { getTooltipMessage } from "@/lib/config"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, CefrLevel, Direction, DictionaryPayload, TranslationPayload } from "@/lib/types"

interface TranslatorPanelProps {
  guestMode: boolean
  onAddCard: (card: CardRecord) => void
}

const CEFR_STYLES: Record<CefrLevel, { badge: string; dot: string; label: string }> = {
  A1: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Beginner"
  },
  A2: {
    badge: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
    dot: "bg-lime-500",
    label: "Elementary"
  },
  B1: {
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    label: "Intermediate"
  },
  B2: {
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
    label: "Upper-intermediate"
  },
  C1: {
    badge: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
    label: "Advanced"
  },
  C2: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    label: "Mastery"
  }
}

function mergeTranslationAlternatives(terms: string[], excludedTerms: string[]) {
  const excluded = new Set(excludedTerms.map((term) => term.trim().toLowerCase()).filter(Boolean))
  const seen = new Set<string>()

  return terms
    .map((term) => term.trim())
    .filter((term) => {
      const key = term.toLowerCase()

      if (!term || excluded.has(key) || seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

type EnglishSynonym = DictionaryPayload["synonyms"][number]

function mergeEnglishSynonyms(synonyms: EnglishSynonym[], excludedTerms: string[]) {
  const excluded = new Set(excludedTerms.map((term) => term.trim().toLowerCase()).filter(Boolean))
  const seen = new Set<string>()

  return synonyms.filter((synonym) => {
    const key = synonym.word.trim().toLowerCase()

    if (!key || excluded.has(key) || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function TranslatorPanel({
  guestMode,
  onAddCard
}: TranslatorPanelProps) {
  const [query, setQuery] = useState("")
  const [direction, setDirection] = useState<Direction>("en-ru")
  const [translation, setTranslation] = useState("")
  const [translationAlternatives, setTranslationAlternatives] = useState<string[]>([])
  const [englishSynonyms, setEnglishSynonyms] = useState<EnglishSynonym[]>([])
  const [cefrLevel, setCefrLevel] = useState<CefrLevel | null>(null)
  const [example, setExample] = useState<string | null>(null)
  const [phonetic, setPhonetic] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const { showToast } = useToast()

  async function handleTranslate() {
    if (!query.trim()) {
      showToast("Type a word to translate.", "error")
      return
    }

    setLoading(true)
    setTranslationAlternatives([])
    setEnglishSynonyms([])
    setCefrLevel(null)

    try {
      const languagePair = direction === "en-ru" ? "en|ru" : "ru|en"
      const translationResponse = await fetch(
        `/api/translate?q=${encodeURIComponent(query.trim())}&langpair=${encodeURIComponent(languagePair)}`,
        {
          cache: "no-store"
        }
      )

      if (!translationResponse.ok) {
        throw new Error("Translation failed.")
      }

      const translationPayload =
        (await translationResponse.json()) as TranslationPayload
      const translated = translationPayload.translation
      setTranslation(translated)
      const nextTranslationAlternatives = mergeTranslationAlternatives(
        translationPayload.translationAlternatives,
        [translated, query.trim()]
      )
      setTranslationAlternatives(nextTranslationAlternatives)
      setCefrLevel(translationPayload.cefrLevel)

      const dictionaryWord = direction === "en-ru" ? query.trim() : translated
      if (dictionaryWord) {
        const dictionaryResponse = await fetch(
          `/api/dictionary?word=${encodeURIComponent(dictionaryWord)}`,
          {
            cache: "no-store"
          }
        )

        if (dictionaryResponse.ok) {
          const dictionaryPayload =
            (await dictionaryResponse.json()) as DictionaryPayload
          setExample(dictionaryPayload.example)
          setPhonetic(dictionaryPayload.phonetic)
          setEnglishSynonyms(
            mergeEnglishSynonyms(
              dictionaryPayload.synonyms,
              [translated, query.trim()]
            )
          )
        } else {
          setExample(null)
          setPhonetic(null)
          setEnglishSynonyms([])
        }
      }
    } catch {
      showToast("Translation is temporarily unavailable.", "error")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCard() {
    if (guestMode || !query.trim() || !translation.trim()) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          original: query.trim(),
          translation: translation.trim(),
          translationAlternatives: mergeTranslationAlternatives(
            [...translationAlternatives, ...englishSynonyms.map((synonym) => synonym.word)],
            [translation.trim(), query.trim()]
          ),
          direction,
          example,
          phonetic
        })
      })

      if (!response.ok) {
        throw new Error("Unable to save card.")
      }

      const payload = (await response.json()) as {
        card: CardRecord
      }
      onAddCard(payload.card)
      showToast("Card added to your deck.", "success")
    } catch {
      showToast("Could not add the card right now.", "error")
    } finally {
      setSaving(false)
    }
  }

  function handleSwapDirection() {
    if (swapping) {
      return
    }

    const nextDirection = direction === "en-ru" ? "ru-en" : "en-ru"
    const nextQuery = translation || query
    const nextTranslation = query

    setSwapping(true)

    window.setTimeout(() => {
      setDirection(nextDirection)
      setQuery(nextQuery)
      setTranslation(nextTranslation)
      setTranslationAlternatives([])
      setEnglishSynonyms([])
      setCefrLevel(null)
      setExample(null)
      setPhonetic(null)
    }, 190)

    window.setTimeout(() => {
      setSwapping(false)
    }, 420)
  }

  const ttsLanguage = direction === "en-ru" ? "en-US" : "ru-RU"
  const translatedLanguage = direction === "en-ru" ? "ru-RU" : "en-US"
  const sourceLabel = direction === "en-ru" ? "English" : "Russian"
  const targetLabel = direction === "en-ru" ? "Russian" : "English"
  const englishSynonymsBlock = englishSynonyms.length > 0 ? (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
        Synonyms
      </p>
      <div className="flex flex-wrap gap-1.5">
        {englishSynonyms.map((item, index) => (
          <span
            key={item.word}
            className="translate-chip-enter inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[13px] font-medium text-text-secondary"
            style={{ animationDelay: `${70 + index * 36}ms` }}
          >
            {item.word}
            {item.cefrLevel && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${CEFR_STYLES[item.cefrLevel].badge}`}>
                {item.cefrLevel}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  ) : null

  return (
    <section className="translate-phone-surface space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[34px] font-black leading-none tracking-tight text-white md:text-[44px]">
          Translate
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#28282f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-[#303039]"
            aria-label="Translation options"
          >
            <SlidersHorizontal size={20} />
          </button>
          <button
            type="button"
            onClick={handleSwapDirection}
            disabled={swapping}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#28282f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-[#303039]"
            aria-label="Swap languages"
          >
            <ArrowLeftRight className={swapping ? "translate-swap-icon--active" : ""} size={20} />
          </button>
        </div>
      </div>

      <div className="rounded-[26px] bg-[#19191e] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:max-w-[380px]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <button
            type="button"
            onClick={() => setDirection("en-ru")}
            className={`min-h-10 rounded-[22px] px-3 text-[14px] font-bold transition-all duration-300 ${direction === "en-ru"
                ? "bg-[#f2f2f4] text-black"
                : "text-white/48 hover:bg-white/[0.05] hover:text-white"
              }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={handleSwapDirection}
            disabled={swapping}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/38 transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Swap languages"
          >
            <ArrowLeftRight className={swapping ? "translate-swap-icon--active" : ""} size={18} />
          </button>
          <button
            type="button"
            onClick={() => setDirection("ru-en")}
            className={`min-h-10 rounded-[22px] px-3 text-[14px] font-bold transition-all duration-300 ${direction === "ru-en"
                ? "bg-[#f2f2f4] text-black"
                : "text-white/48 hover:bg-white/[0.05] hover:text-white"
              }`}
          >
            Russian
          </button>
        </div>
      </div>

      <div className={`translate-card-grid grid gap-3 lg:grid-cols-2 ${swapping ? "translate-card-grid--swapping" : ""}`}>
        <div className={`translate-card flex flex-col p-4 md:p-6 ${loading ? "translate-card--loading" : ""}`}>
          <div className="flex flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/42">
                {sourceLabel}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <textarea
                id="translation-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleTranslate() } }}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                placeholder={direction === "en-ru" ? "Enter text" : "Введите текст"}
                rows={translation ? 1 : 3}
                className={`w-full resize-none border-0 bg-transparent p-0 font-black tracking-tight text-white outline-none placeholder:text-white/24 ${
                  translation
                    ? "min-h-[42px] text-[26px] md:text-[32px]"
                    : "min-h-[110px] flex-1 text-[26px] md:text-[32px]"
                }`}
              />
              {direction === "en-ru" && cefrLevel && (
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold ${CEFR_STYLES[cefrLevel].badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${CEFR_STYLES[cefrLevel].dot}`} />
                  {cefrLevel}
                </span>
              )}
            </div>

            {direction === "en-ru" && phonetic && translation ? (
              <p className="mt-1 text-[14px] font-medium text-white/48">{phonetic}</p>
            ) : direction === "en-ru" && phonetic ? (
              <p className="mt-2 text-[15px] font-medium text-white/48">{phonetic}</p>
            ) : null}
            {direction === "en-ru" && englishSynonymsBlock}

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                {canSpeak() && (
                  <button
                    type="button"
                    onClick={() => speakText(query, ttsLanguage)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292930] text-white/68 transition hover:bg-[#34343c] hover:text-white"
                    aria-label="Speak source word"
                  >
                    <Volume2 size={18} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleTranslate()}
                disabled={loading || !query.trim()}
                className="min-h-10 rounded-full bg-[#f2f2f4] px-5 text-[14px] font-black text-black transition hover:bg-white disabled:opacity-45"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="translate-loader-dot" />
                    Translating
                  </span>
                ) : (
                  "Translate"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className={`translate-card flex min-h-[260px] flex-col p-5 md:min-h-[320px] md:p-6 ${loading ? "translate-card--loading" : ""}`}>
          {loading ? (
            <div className="translate-result-loading flex flex-1 flex-col">
              <div className="h-8 w-2/3 rounded-full bg-white/[0.09]" />
              <div className="mt-4 h-4 w-1/3 rounded-full bg-white/[0.055]" />
              <div className="mt-8 grid gap-2">
                <div className="h-3 w-full rounded-full bg-white/[0.045]" />
                <div className="h-3 w-5/6 rounded-full bg-white/[0.04]" />
                <div className="h-3 w-2/3 rounded-full bg-white/[0.035]" />
              </div>
            </div>
          ) : translation ? (
            <div key={`${direction}-${translation}`} className="translate-result-enter flex flex-1 flex-col">
              <div className="flex-1">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/42">
                    {targetLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[30px] font-black tracking-tight text-white md:text-[40px]">{translation}</p>
                  {direction === "ru-en" && cefrLevel && (
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold ${CEFR_STYLES[cefrLevel].badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${CEFR_STYLES[cefrLevel].dot}`} />
                      {cefrLevel}
                    </span>
                  )}
                </div>
                {direction === "ru-en" && phonetic && (
                  <p className="mt-2 text-[15px] font-medium text-white/50">{phonetic}</p>
                )}
                {direction === "ru-en" && englishSynonymsBlock}

                <div className="mt-6 space-y-5">
                  {translationAlternatives.length > 0 && (
                    <div>
                      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-white/42">Alternative translations</p>
                      <div className="flex flex-wrap gap-2">
                        {translationAlternatives.map((item, index) => (
                          <span
                            key={item}
                            className="translate-chip-enter rounded-full bg-white/[0.06] px-2.5 py-1 text-[14px] font-medium text-white/64"
                            style={{ animationDelay: `${90 + index * 38}ms` }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {example && (
                    <p className="translate-chip-enter border-l border-white/[0.1] pl-3 text-[14px] leading-relaxed text-white/58">{example}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  {canSpeak() && (
                    <button
                      type="button"
                      onClick={() => speakText(translation, translatedLanguage)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292930] text-white/68 transition hover:bg-[#34343c] hover:text-white"
                      aria-label="Speak translated text"
                    >
                      <Volume2 size={18} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleAddCard()}
                  disabled={guestMode || saving}
                  title={guestMode ? getTooltipMessage() : undefined}
                  className="min-h-10 rounded-full bg-[#292930] px-5 text-[14px] font-black text-white transition hover:bg-[#34343c] disabled:opacity-45"
                >
                  {saving ? "Saving..." : "Add to cards"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center text-[26px] font-black tracking-tight text-white/22 md:text-[32px]">
              Translation
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

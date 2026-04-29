"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { UserRound, Volume2 } from "lucide-react"

import { useToast } from "@/components/Toast"
import { updateClientResourceData } from "@/hooks/useClientResource"
import { getTooltipMessage } from "@/lib/config"
import { speakText, canSpeak } from "@/lib/tts"
import type {
  CardRecord,
  CardsResponse,
  CefrLevel,
  CefrProfilePayload,
  DailyCatalogStatus,
  Direction,
  DictionaryPayload,
  TranslationPayload
} from "@/lib/types"

interface TranslatorPanelProps {
  guestMode: boolean
  onAddCard: (card: CardRecord) => void
  dailyCatalog?: DailyCatalogStatus | null
  onOpenDailyWords?: () => void
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

const CEFR_PROFILE_TEXT_STYLES: Record<string, string> = {
  A1: "text-emerald-300",
  A2: "text-lime-300",
  B1: "text-sky-300",
  B2: "text-indigo-300",
  C1: "text-fuchsia-300",
  C2: "text-rose-300",
  "Off-List": "text-amber-300"
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

export function TranslatorPanel({
  guestMode,
  onAddCard,
  dailyCatalog: _dailyCatalog = null,
  onOpenDailyWords: _onOpenDailyWords
}: TranslatorPanelProps) {
  const queryTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [query, setQuery] = useState("")
  const [direction, setDirection] = useState<Direction>("en-ru")
  const [translation, setTranslation] = useState("")
  const [translationAlternatives, setTranslationAlternatives] = useState<string[]>([])
  const [translationSource, setTranslationSource] = useState<TranslationPayload["source"] | null>(null)
  const [cefrLevel, setCefrLevel] = useState<CefrLevel | null>(null)
  const [cefrProfilerEnabled, setCefrProfilerEnabled] = useState(false)
  const [cefrProfile, setCefrProfile] = useState<CefrProfilePayload | null>(null)
  const [selectedCefrWord, setSelectedCefrWord] = useState<{
    text: string
    level: string
  } | null>(null)
  const [example, setExample] = useState<string | null>(null)
  const [phonetic, setPhonetic] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  async function handleTranslate() {
    if (!query.trim()) {
      showToast("Type a word to translate.", "error")
      return
    }

    const trimmedQuery = query.trim()
    setLoading(true)
    setLoadingDetails(false)
    setTranslation("")
    setTranslationAlternatives([])
    setTranslationSource(null)
    setCefrLevel(null)
    setCefrProfilerEnabled(false)
    setCefrProfile(null)
    setSelectedCefrWord(null)
    setExample(null)
    setPhonetic(null)

    try {
      const languagePair = direction === "en-ru" ? "en|ru" : "ru|en"
      const translationResponse = await fetch(
        `/api/translate?q=${encodeURIComponent(trimmedQuery)}&langpair=${encodeURIComponent(languagePair)}`,
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
        [translated, trimmedQuery]
      )
      setTranslationAlternatives(nextTranslationAlternatives)
      setTranslationSource(translationPayload.source)
      setCefrLevel(translationPayload.cefrLevel)
      setCefrProfilerEnabled(translationPayload.cefrProfilerEnabled)
      setLoading(false)

      const englishText =
        direction === "en-ru" ? trimmedQuery : translated.trim()
      const dictionaryWord = direction === "en-ru" ? trimmedQuery : translated
      const shouldFetchCefrProfile =
        translationPayload.cefrProfilerEnabled &&
        Boolean(englishText) &&
        !(translationPayload.source === "catalog" && !trimmedQuery.includes(" "))

      if (shouldFetchCefrProfile || dictionaryWord) {
        setLoadingDetails(true)

        const [cefrProfileResult, dictionaryResult] = await Promise.allSettled([
          shouldFetchCefrProfile
            ? fetch("/api/cefr-profile", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  text: englishText
                })
              })
            : Promise.resolve(null),
          dictionaryWord
            ? fetch(`/api/dictionary?word=${encodeURIComponent(dictionaryWord)}`, {
                cache: "no-store"
              })
            : Promise.resolve(null)
        ])

        if (cefrProfileResult.status === "fulfilled" && cefrProfileResult.value?.ok) {
          const cefrProfilePayload =
            (await cefrProfileResult.value.json()) as CefrProfilePayload
          setCefrProfile(cefrProfilePayload)
        }

        if (dictionaryResult.status === "fulfilled" && dictionaryResult.value?.ok) {
          const dictionaryPayload =
            (await dictionaryResult.value.json()) as DictionaryPayload
          setExample(dictionaryPayload.example)
          setPhonetic(dictionaryPayload.phonetic)
        }

        setLoadingDetails(false)
      }
    } catch {
      showToast("Translation is temporarily unavailable.", "error")
      setLoading(false)
      setLoadingDetails(false)
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
            translationAlternatives,
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
      updateClientResourceData<CardsResponse>("cards:collection", (current) => {
        if (!current) {
          return null
        }

        const nextCards = [payload.card, ...current.cards.filter((card) => card.id !== payload.card.id)]
        const dailyTarget = current.dailyCatalog.dailyTarget || 10
        const todayCount = Math.min(
          nextCards.filter((card) => card.nextReviewDate <= new Date().toISOString().slice(0, 10)).length,
          dailyTarget
        )

        return {
          ...current,
          cards: nextCards,
          summary: {
            ...current.summary,
            totalCards: nextCards.length,
            dueToday: todayCount
          },
          dailyCatalog: {
            ...current.dailyCatalog,
            todayCount,
            savedCount: nextCards.length,
            waitingCount: Math.max(nextCards.length - todayCount, 0)
          }
        }
      })
      onAddCard(payload.card)
      showToast("Card added to your deck.", "success")
    } catch {
      showToast("Could not add the card right now.", "error")
    } finally {
      setSaving(false)
    }
  }

  function handleDirectionChange(nextDirection: Direction) {
    if (nextDirection === direction) {
      return
    }

    const nextQuery = translation || query
    const nextTranslation = query

    setDirection(nextDirection)
    setQuery(nextQuery)
    setTranslation(nextTranslation)
    setTranslationAlternatives([])
    setTranslationSource(null)
    setCefrLevel(null)
    setCefrProfilerEnabled(false)
    setCefrProfile(null)
    setSelectedCefrWord(null)
    setExample(null)
    setPhonetic(null)
  }

  const ttsLanguage = direction === "en-ru" ? "en-US" : "ru-RU"
  const translatedLanguage = direction === "en-ru" ? "ru-RU" : "en-US"
  const sourceLabel = direction === "en-ru" ? "English" : "Russian"
  const targetLabel = direction === "en-ru" ? "Russian" : "English"
  const translationSourceLabel =
    translationSource === "catalog"
      ? "Catalog"
      : translationSource === "deepl"
        ? "DeepL"
        : translationSource === "langeek"
          ? "LanGeek"
          : null
  const shouldShowColoredSourceText =
    Boolean(translation) &&
    cefrProfilerEnabled &&
    Boolean(cefrProfile?.segments.length) &&
    ((direction === "en-ru" && query.trim()) || (direction === "ru-en" && translation.trim()))
  useEffect(() => {
    const textarea = queryTextareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "0px"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [query, translation])

  return (
    <section className="translate-phone-surface space-y-5">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[14rem] bg-gradient-to-b from-black via-black/78 to-transparent"
        aria-hidden="true"
      />

      <div className="fixed left-1/2 top-3 z-30 w-[calc(100%-2rem)] max-w-[38rem] -translate-x-1/2 md:top-6">
        <div className="relative flex items-center justify-center gap-3">
          <div className="relative flex rounded-full border border-white/[0.06] bg-white/[0.03] p-1 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <div className="relative grid grid-cols-2 items-center">
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-1 top-1 z-0 w-[calc(50%-0.25rem)] rounded-full border border-white/[0.1] bg-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                initial={false}
                animate={{
                  x: direction === "en-ru" ? "0%" : "100%"
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ left: "0.25rem" }}
              />
              <button
                type="button"
                onClick={() => handleDirectionChange("en-ru")}
                className={`relative z-10 flex min-w-[140px] items-center justify-center rounded-full px-5 py-3 text-[14px] font-semibold transition-all duration-300 ${direction === "en-ru"
                    ? "text-white"
                    : "text-white/50 hover:text-white"
                  }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleDirectionChange("ru-en")}
                className={`relative z-10 flex min-w-[140px] items-center justify-center rounded-full px-5 py-3 text-[14px] font-semibold transition-all duration-300 ${direction === "ru-en"
                    ? "text-white"
                    : "text-white/50 hover:text-white"
                  }`}
              >
                Russian
              </button>
            </div>
          </div>
          <Link
            href="/profile"
            aria-label="Open profile"
            className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/74 shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition hover:bg-white/[0.06] hover:text-white"
          >
            <UserRound size={20} />
          </Link>
        </div>
      </div>

      <div className="h-[5.5rem] md:h-[6.75rem]" />

      <div className="translate-card-grid grid gap-3 lg:grid-cols-2">
        <motion.div
          layout
          transition={{
            layout: {
              duration: 0.52,
              ease: [0.22, 1, 0.36, 1]
            }
          }}
          className={`translate-card flex flex-col p-4 md:p-6 ${loading ? "translate-card--loading" : ""}`}
        >
          <div className="flex flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/42">
                {sourceLabel}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="w-full">
                <textarea
                  ref={queryTextareaRef}
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
                  className={`w-full overflow-hidden resize-none border-0 bg-transparent p-0 font-black tracking-tight text-white outline-none placeholder:text-white/24 ${
                    translation
                      ? "min-h-[42px] text-[26px] md:text-[32px]"
                      : "min-h-[110px] flex-1 text-[26px] md:text-[32px]"
                  }`}
                />
                {shouldShowColoredSourceText && cefrProfile && (
                  <div className="relative mt-3">
                    <div className="text-[18px] font-bold leading-relaxed tracking-tight md:text-[22px]">
                    {cefrProfile.segments.map((segment, index) => (
                        segment.level ? (
                          <button
                            key={`${segment.text}-${index}`}
                            type="button"
                            onClick={() =>
                              setSelectedCefrWord(
                                selectedCefrWord?.text === segment.text && selectedCefrWord.level === segment.level
                                  ? null
                                  : { text: segment.text.trim(), level: segment.level as string }
                              )
                            }
                            className={`inline rounded-sm transition hover:opacity-85 ${CEFR_PROFILE_TEXT_STYLES[segment.level] ?? "text-white/78"}`}
                          >
                            {segment.text}
                          </button>
                        ) : (
                          <span
                            key={`${segment.text}-${index}`}
                            className="text-white/30"
                          >
                            {segment.text}
                          </span>
                        )
                      ))}
                    </div>
                    {selectedCefrWord && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#202028] px-3 py-2 text-[13px] font-medium text-white/78 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${CEFR_STYLES[selectedCefrWord.level as CefrLevel]?.badge ?? "bg-amber-500/10 text-amber-300"}`}>
                          {selectedCefrWord.level}
                        </span>
                        <span>{selectedCefrWord.text}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
        </motion.div>

        <motion.div
          layout
          transition={{
            layout: {
              duration: 0.52,
              ease: [0.22, 1, 0.36, 1]
            }
          }}
          className={`translate-card flex min-h-[260px] flex-col p-5 md:min-h-[320px] md:p-6 ${(loading && !translation) ? "translate-card--loading" : ""}`}
        >
          {loading && !translation ? (
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
                  {translationSourceLabel && (
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">
                      {translationSourceLabel}
                    </span>
                  )}
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
                  {loadingDetails && !example && !phonetic ? (
                    <p className="text-[13px] text-white/40">Loading details...</p>
                  ) : null}
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
            <div className="flex flex-1 text-[26px] text-white transition text-opacity-50 font-black tracking-tight md:text-[32px]">
              Translation
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

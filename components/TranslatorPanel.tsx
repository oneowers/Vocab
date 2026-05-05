"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { UserRound, Volume2 } from "lucide-react"

import { useToast } from "@/components/Toast"
import { AppleHeader, AppleCard, AppleSpinner } from "@/components/AppleDashboardComponents"
import { updateClientResourceData } from "@/hooks/useClientResource"
import { getTooltipMessage } from "@/lib/config"
import { speakText, useCanSpeak } from "@/lib/tts"
import type {
  AppUserRecord,
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
  user: AppUserRecord
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
  user,
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
  const speakable = useCanSpeak()

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
    <section className="space-y-4">
      <AppleHeader
        title="Translate"
        rightElement={
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
            <UserRound size={18} />
          </div>
        }
      />

      <div className="pt-16" />

      <div className="grid gap-3 lg:grid-cols-2">
        <motion.div
          layout
          className={`relative overflow-hidden rounded-[32px] border border-white/[0.12] bg-[#1C1C1E] flex flex-col p-5 md:p-8 shadow-2xl transition-all ${loading ? "opacity-60" : "opacity-100"}`}
        >
          <div className="flex flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/30">
                {sourceLabel}
              </span>
              {direction === "en-ru" && cefrLevel && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${CEFR_STYLES[cefrLevel].badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${CEFR_STYLES[cefrLevel].dot}`} />
                  {cefrLevel}
                </span>
              )}
            </div>

            <div className="flex-1">
              <textarea
                ref={queryTextareaRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleTranslate() } }}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                placeholder={direction === "en-ru" ? "Enter text" : "Введите текст"}
                className={`w-full overflow-hidden resize-none border-0 bg-transparent p-0 font-black tracking-tight text-white outline-none placeholder:text-white/10 ${translation
                  ? "min-h-[42px] text-[26px] md:text-[32px]"
                  : "min-h-[110px] flex-1 text-[26px] md:text-[32px]"
                  }`}
              />

              {shouldShowColoredSourceText && cefrProfile && (
                <div className="mt-4">
                  <div className="text-[18px] font-bold leading-relaxed tracking-tight text-white/90 md:text-[22px]">
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
                          className={`inline rounded-sm transition hover:opacity-80 ${CEFR_PROFILE_TEXT_STYLES[segment.level] ?? "text-white"}`}
                        >
                          {segment.text}
                        </button>
                      ) : (
                        <span key={`${segment.text}-${index}`} className="text-white/20">
                          {segment.text}
                        </span>
                      )
                    ))}
                  </div>
                  {selectedCefrWord && (
                    <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-[14px] font-bold text-white shadow-xl">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${CEFR_STYLES[selectedCefrWord.level as CefrLevel]?.badge ?? "bg-amber-500/10 text-amber-300"}`}>
                        {selectedCefrWord.level}
                      </span>
                      <span>{selectedCefrWord.text}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {speakable && query.trim() && (
                  <button
                    type="button"
                    onClick={() => speakText(query, ttsLanguage)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-white/40 border border-white/[0.08] transition-all hover:bg-white/[0.1] hover:text-white"
                  >
                    <Volume2 size={20} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleTranslate()}
                disabled={loading || !query.trim()}
                className="h-11 px-8 rounded-2xl bg-white text-black text-[15px] font-bold transition-all active:scale-95 disabled:opacity-45 hover:opacity-90"
              >
                {loading ? <AppleSpinner className="h-5" /> : "Translate"}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          layout
          className="relative overflow-hidden rounded-[32px] border border-white/[0.12] bg-[#161618] flex min-h-[280px] flex-col p-5 md:min-h-[340px] md:p-8 shadow-2xl transition-all"
        >
          {loading && !translation ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <AppleSpinner className="h-10" />
              <p className="mt-4 text-[14px] font-medium text-white/20">Translating...</p>
            </div>
          ) : translation ? (
            <div className="flex flex-1 flex-col">
              <div className="flex-1">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/30">
                    {targetLabel}
                  </span>
                  {translationSourceLabel && (
                    <span className="rounded-full bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/40">
                      {translationSourceLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <p className="text-[30px] font-black tracking-tight text-white md:text-[40px] leading-tight">
                    {translation}
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  {translationAlternatives.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/25">Alternatives</p>
                      <div className="flex flex-wrap gap-2">
                        {translationAlternatives.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 text-[14px] font-semibold text-white/60"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {example && (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/25">Example</p>
                      <p className="border-l-2 border-white/10 pl-4 text-[15px] leading-relaxed text-white/50 italic">
                        "{example}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  {speakable && (
                    <button
                      type="button"
                      onClick={() => speakText(translation, translatedLanguage)}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-white/40 border border-white/[0.08] transition-all hover:bg-white/[0.1] hover:text-white"
                    >
                      <Volume2 size={20} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleAddCard()}
                  disabled={guestMode || saving}
                  className="h-11 px-8 rounded-2xl bg-white/[0.08] text-white text-[15px] font-bold border border-white/[0.12] transition-all active:scale-95 hover:bg-white/[0.12] disabled:opacity-45 shadow-lg"
                >
                  {saving ? "Saving..." : "Add to cards"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-[26px] font-black tracking-tighter text-white/10 md:text-[32px]">
                Translation
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}


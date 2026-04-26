"use client"

import { useState } from "react"
import { ArrowLeftRight, Languages, Volume2 } from "lucide-react"

import { useToast } from "@/components/Toast"
import { getTooltipMessage } from "@/lib/config"
import { speakText, canSpeak } from "@/lib/tts"
import type { CardRecord, Direction, DictionaryPayload, TranslationPayload } from "@/lib/types"

interface TranslatorPanelProps {
  guestMode: boolean
  onAddCard: (card: CardRecord) => void
}

export function TranslatorPanel({
  guestMode,
  onAddCard
}: TranslatorPanelProps) {
  const [query, setQuery] = useState("")
  const [direction, setDirection] = useState<Direction>("en-ru")
  const [translation, setTranslation] = useState("")
  const [example, setExample] = useState<string | null>(null)
  const [phonetic, setPhonetic] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  async function handleTranslate() {
    if (!query.trim()) {
      showToast("Type a word to translate.", "error")
      return
    }

    setLoading(true)

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
        } else {
          setExample(null)
          setPhonetic(null)
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
    setDirection((current) => (current === "en-ru" ? "ru-en" : "en-ru"))
    setQuery(translation || query)
    setTranslation(query)
  }

  const ttsLanguage = direction === "en-ru" ? "en-US" : "ru-RU"
  const translatedLanguage = direction === "en-ru" ? "ru-RU" : "en-US"
  const sourceLabel = direction === "en-ru" ? "English" : "Russian"
  const targetLabel = direction === "en-ru" ? "Russian" : "English"

  return (
    <section className="panel overflow-hidden rounded-[20px] p-0">
      <div className="border-b border-separator px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-text-secondary">
          <Languages size={18} className="text-accent" />
          Translator
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center md:gap-3">
          <button
            type="button"
            onClick={() => setDirection("en-ru")}
            className="rounded-[12px] px-3 py-2 text-[15px] font-semibold transition data-[active=true]:bg-bg-secondary data-[active=true]:text-text-primary md:px-4"
            data-active={direction === "en-ru"}
          >
            English
          </button>
          <button
            type="button"
            onClick={handleSwapDirection}
            className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-secondary text-text-tertiary transition hover:text-text-primary"
            aria-label="Swap languages"
          >
            <ArrowLeftRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => setDirection("ru-en")}
            className="rounded-[12px] px-3 py-2 text-[15px] font-semibold transition data-[active=true]:bg-bg-secondary data-[active=true]:text-text-primary md:px-4"
            data-active={direction === "ru-en"}
          >
            Russian
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-separator p-4 md:p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              {sourceLabel}
            </p>
            {canSpeak() ? (
              <button
                type="button"
                onClick={() => speakText(query, ttsLanguage)}
                className="button-ghost min-h-[36px] px-2"
                aria-label="Speak source word"
              >
                <Volume2 size={18} />
              </button>
            ) : null}
          </div>
          <textarea
            id="translation-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              direction === "en-ru" ? "Type text to translate" : "Введите текст для перевода"
            }
            className="mt-4 min-h-[132px] w-full resize-none border-0 bg-transparent p-0 text-[24px] font-bold tracking-[-0.5px] text-text-primary outline-none placeholder:text-text-tertiary md:min-h-[220px] md:text-[28px]"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleTranslate()}
              disabled={loading || !query.trim()}
              className="button-primary w-full"
            >
              {loading ? "Translating..." : "Translate"}
            </button>
          </div>
        </div>

        <div className="bg-bg-secondary/45 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              {targetLabel}
            </p>
            {canSpeak() && translation ? (
              <button
                type="button"
                onClick={() => speakText(translation, translatedLanguage)}
                className="button-ghost min-h-[36px] px-2"
                aria-label="Speak translated text"
              >
                <Volume2 size={18} />
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              <div className="skeleton h-8 w-2/3 rounded-[12px]" />
              <div className="skeleton h-4 w-1/3 rounded-[12px]" />
              <div className="skeleton h-20 w-full rounded-[16px] md:h-24" />
            </div>
          ) : translation ? (
            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <p className="text-[24px] font-bold tracking-[-0.5px] text-text-primary md:text-[28px]">
                  {translation}
                </p>
                {phonetic ? <p className="text-[13px] text-text-tertiary">{phonetic}</p> : null}
              </div>
              {example ? (
                <p className="rounded-[16px] bg-bg-primary px-4 py-3 text-[15px] leading-6 text-text-secondary">
                  {example}
                </p>
              ) : (
                <div className="min-h-[84px] rounded-[16px] bg-bg-primary/70 md:min-h-[120px]" />
              )}
            </div>
          ) : (
            <div className="mt-4 flex min-h-[132px] items-center rounded-[16px] bg-bg-primary/70 px-5 md:min-h-[220px]">
              <p className="text-[18px] text-text-tertiary">
                Translation will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-separator p-4 md:px-6 md:py-5">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleAddCard()}
            disabled={guestMode || saving || !translation}
            title={guestMode ? getTooltipMessage() : undefined}
            className="button-primary w-full"
          >
            {saving ? "Saving..." : "Add to cards"}
          </button>
        </div>
      </div>
    </section>
  )
}

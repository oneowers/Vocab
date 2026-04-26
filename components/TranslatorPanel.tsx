"use client"

import { useState } from "react"

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
  const [tags, setTags] = useState("")
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
          phonetic,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
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

  const ttsLanguage = direction === "en-ru" ? "en-US" : "ru-RU"
  const translatedLanguage = direction === "en-ru" ? "ru-RU" : "en-US"
  const headline =
    query.trim() ||
    (direction === "en-ru" ? "Type a word to translate" : "Введите слово для перевода")
  const subtitle = direction === "en-ru" ? "English to Russian" : "Russian to English"

  return (
    <section className="panel rounded-[20px] p-6 md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          <button
            type="button"
            onClick={() => setDirection("en-ru")}
            className="chip-button"
            data-active={direction === "en-ru"}
          >
            EN → RU
          </button>
          <button
            type="button"
            onClick={() => setDirection("ru-en")}
            className="chip-button"
            data-active={direction === "ru-en"}
          >
            RU → EN
          </button>
        </div>

        <div className="space-y-2 text-center">
          <p className="section-label">Translation</p>
          <h2 className="text-[28px] font-bold tracking-[-0.5px] text-text-primary">
            {headline}
          </h2>
          <p className="text-[13px] text-text-tertiary">{subtitle}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[16px] border border-separator bg-bg-primary p-4">
          <label
            className="text-[15px] font-semibold text-text-primary"
            htmlFor="translation-query"
          >
            Word or phrase
          </label>
            <div className="mt-3 flex flex-col gap-3">
              <input
                id="translation-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleTranslate()
                  }
                }}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  direction === "en-ru" ? "Type an English word..." : "Введите русское слово..."
                }
                className="input-field"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                {canSpeak() ? (
                  <button
                    type="button"
                    onClick={() => speakText(query, ttsLanguage)}
                    className="button-secondary w-full sm:w-auto"
                    aria-label="Speak source word"
                  >
                    Listen
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleTranslate()}
                  disabled={loading}
                  className="button-primary w-full"
                >
                  {loading ? "Translating..." : "Translate"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] border border-separator bg-bg-secondary p-4">
            <p className="text-[15px] font-semibold text-text-primary">Result</p>
            {loading ? (
              <div className="mt-4 space-y-3">
                <div className="skeleton h-7 w-3/4 rounded-[12px]" />
                <div className="skeleton h-4 w-1/2 rounded-[12px]" />
                <div className="skeleton h-20 w-full rounded-[16px]" />
              </div>
            ) : translation ? (
              <div className="mt-4 space-y-4">
                <div className="space-y-1 text-center lg:text-left">
                  <p className="text-[28px] font-bold tracking-[-0.5px] text-text-primary">{translation}</p>
                  {phonetic ? <p className="text-[13px] text-text-tertiary">{phonetic}</p> : null}
                </div>
                {canSpeak() ? (
                  <button
                    type="button"
                    onClick={() => speakText(translation, translatedLanguage)}
                    className="button-secondary w-full"
                  >
                    Listen to translation
                  </button>
                ) : null}
                {example ? (
                  <p className="rounded-[16px] bg-bg-primary px-4 py-3 text-[15px] leading-6 text-text-secondary">
                    {example}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-[15px] leading-6 text-text-secondary">
                Translate a word to see the meaning, phonetic hint, and example sentence.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[16px] border border-separator bg-bg-primary p-4">
          <label className="text-[15px] font-semibold text-text-primary" htmlFor="tag-input">
            Tags
          </label>
          <input
            id="tag-input"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            placeholder="travel, verbs, work"
            className="input-field mt-3"
          />

          <div className="mt-4 flex flex-wrap gap-3">
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
      </div>
    </section>
  )
}

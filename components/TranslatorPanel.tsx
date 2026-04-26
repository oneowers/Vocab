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

  return (
    <section className="panel rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-quiet">
            Translator
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Build your next card</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection("en-ru")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              direction === "en-ru" ? "bg-ink text-white" : "bg-[#F4F5F7] text-muted"
            }`}
          >
            EN → RU
          </button>
          <button
            type="button"
            onClick={() => setDirection("ru-en")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              direction === "ru-en" ? "bg-ink text-white" : "bg-[#F4F5F7] text-muted"
            }`}
          >
            RU → EN
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[1.75rem] border border-line bg-white p-4">
          <label className="text-sm font-medium text-ink" htmlFor="translation-query">
            Word or phrase
          </label>
          <div className="mt-3 flex flex-col gap-3 md:flex-row">
            <input
              id="translation-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleTranslate()
                }
              }}
              placeholder={
                direction === "en-ru" ? "Type an English word..." : "Введите русское слово..."
              }
              className="min-h-[48px] flex-1 rounded-2xl border border-line px-4 py-3 outline-none transition focus:border-ink"
            />
            <div className="flex gap-2">
              {canSpeak() ? (
                <button
                  type="button"
                  onClick={() => speakText(query, ttsLanguage)}
                  className="button-secondary min-h-[48px] px-4 py-3 text-sm"
                  aria-label="Speak source word"
                >
                  🔊
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleTranslate()}
                disabled={loading}
                className="button-primary min-h-[48px] px-5 py-3 text-sm font-medium"
              >
                {loading ? "Translating..." : "Translate"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-line bg-[#FCFCFD] p-4">
          <p className="text-sm font-medium text-ink">Translation</p>
          {loading ? (
            <div className="mt-4 space-y-3">
              <div className="skeleton h-6 w-2/3" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-14 w-full" />
            </div>
          ) : translation ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-ink">{translation}</p>
                  {phonetic ? <p className="mt-1 text-sm text-quiet">{phonetic}</p> : null}
                </div>
                {canSpeak() ? (
                  <button
                    type="button"
                    onClick={() => speakText(translation, translatedLanguage)}
                    className="button-secondary px-3 py-2 text-sm"
                  >
                    🔊
                  </button>
                ) : null}
              </div>
              {example ? (
                <p className="rounded-2xl bg-[#F4F5F7] px-4 py-3 text-sm leading-6 text-muted">
                  {example}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              Translate a word to see the meaning, phonetic hint, and example sentence.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-[1.75rem] border border-line bg-white p-4">
        <label className="text-sm font-medium text-ink" htmlFor="tag-input">
          Tags
        </label>
        <input
          id="tag-input"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="travel, verbs, work"
          className="mt-3 min-h-[48px] w-full rounded-2xl border border-line px-4 py-3 outline-none transition focus:border-ink"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleAddCard()}
            disabled={guestMode || saving || !translation}
            title={guestMode ? getTooltipMessage() : undefined}
            className="button-primary min-h-[48px] px-5 py-3 text-sm font-medium"
          >
            {saving ? "Saving..." : "Add to cards"}
          </button>
        </div>
      </div>
    </section>
  )
}


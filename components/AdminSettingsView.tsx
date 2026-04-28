"use client"

import { useEffect, useState } from "react"

import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import type { AdminSettingsPayload, TranslationProvider } from "@/lib/types"

const DAILY_LIMIT_OPTIONS = [1, 3, 5, 10, 15, 20, 30, 50, 100]
const REVIEW_LIVES_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

const TRANSLATION_PROVIDER_OPTIONS: Array<{
  value: TranslationProvider
  label: string
  description: string
}> = [
  {
    value: "auto",
    label: "Auto",
    description: "Catalog first, then DeepL"
  },
  {
    value: "catalog-only",
    label: "Catalog only",
    description: "Use only local catalog translations"
  },
  {
    value: "deepl-only",
    label: "DeepL only",
    description: "Always request DeepL"
  }
]

export function AdminSettingsView() {
  const { showToast } = useToast()
  const [settingsLimit, setSettingsLimit] = useState("5")
  const [reviewLives, setReviewLives] = useState("3")
  const [translationProvider, setTranslationProvider] = useState<TranslationProvider>("auto")
  const [saving, setSaving] = useState(false)
  const { data, loading } = useClientResource<AdminSettingsPayload>({
    key: "admin:settings",
    loader: async () => {
      const response = await fetch("/api/admin/settings", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load settings.")
      }

      return (await response.json()) as AdminSettingsPayload
    },
    onError: () => {
      showToast("Could not load settings.", "error")
    }
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setSettingsLimit(String(data.settings.dailyNewCardsLimit))
    setReviewLives(String(data.settings.reviewLives))
    setTranslationProvider(data.settings.translationProvider)
  }, [data])

  async function handleSave() {
    setSaving(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dailyNewCardsLimit: Number(settingsLimit),
          reviewLives: Number(reviewLives),
          translationProvider
        })
      })

      if (!response.ok) {
        throw new Error("Could not save settings.")
      }

      const payload = (await response.json()) as AdminSettingsPayload
      setSettingsLimit(String(payload.settings.dailyNewCardsLimit))
      setReviewLives(String(payload.settings.reviewLives))
      setTranslationProvider(payload.settings.translationProvider)
      showToast("Settings updated.", "success")
    } catch {
      showToast("Could not save settings.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) {
    return <div className="skeleton h-[28rem] rounded-[2rem]" />
  }

  return (
    <div className="space-y-5">
      <section className="panel-admin rounded-[2rem] p-5">
        <p className="section-label">Site settings</p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.5px] text-ink">
          Configure global app behavior
        </h1>
        <p className="mt-2 text-sm text-muted">
          These settings affect translation flow and daily card limits across the app.
        </p>
      </section>

      <section className="panel-admin rounded-[2rem] p-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-separator bg-bg-secondary">
          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="font-semibold text-ink">Daily card limit</p>
              <p className="text-sm text-muted">How many new words a learner can claim per day.</p>
            </div>
            <select
              value={settingsLimit}
              onChange={(event) => setSettingsLimit(event.target.value)}
              className="input-field w-28"
            >
              {DAILY_LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="font-semibold text-ink">Hearts per session</p>
              <p className="text-sm text-muted">How many mistakes a learner can make in review.</p>
            </div>
            <select
              value={reviewLives}
              onChange={(event) => setReviewLives(event.target.value)}
              className="input-field w-24"
            >
              {REVIEW_LIVES_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-ink">Translation source</p>
              <p className="text-sm text-muted">Which API is used in the app and admin autofill.</p>
            </div>
            <select
              value={translationProvider}
              onChange={(event) => setTranslationProvider(event.target.value as TranslationProvider)}
              className="input-field w-44"
            >
              {TRANSLATION_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="button-primary whitespace-nowrap"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </section>
    </div>
  )
}

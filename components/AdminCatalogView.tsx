"use client"

import { useEffect, useState } from "react"

import { AdminTable } from "@/components/AdminTable"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { CEFR_LEVELS } from "@/lib/catalog"
import { formatTimestamp } from "@/lib/date"
import type {
  AdminCatalogPayload,
  AdminSettingsPayload,
  CefrLevel,
  DictionaryPayload,
  TranslationPayload,
  WordCatalogRecord
} from "@/lib/types"

interface CatalogFormState {
  word: string
  translation: string
  cefrLevel: CefrLevel
  partOfSpeech: string
  topic: string
  example: string
  phonetic: string
  priority: string
  isPublished: boolean
}

const emptyForm: CatalogFormState = {
  word: "",
  translation: "",
  cefrLevel: "A1",
  partOfSpeech: "",
  topic: "",
  example: "",
  phonetic: "",
  priority: "0",
  isPublished: false
}

export function AdminCatalogView() {
  const [payload, setPayload] = useState<AdminCatalogPayload | null>(null)
  const [settingsLimit, setSettingsLimit] = useState("5")
  const [search, setSearch] = useState("")
  const [topicFilter, setTopicFilter] = useState("")
  const [cefrFilter, setCefrFilter] = useState<"" | CefrLevel>("")
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all")
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<CatalogFormState>(emptyForm)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [savingLimit, setSavingLimit] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const { showToast } = useToast()
  const { data, loading, refreshing } = useClientResource<{
    catalog: AdminCatalogPayload
    settings: AdminSettingsPayload
  }>({
    key: `admin-catalog:${page}:${search}:${topicFilter}:${cefrFilter}:${publishedFilter}`,
    loader: async () => {
      const catalogUrl =
        `/api/admin/catalog?page=${page}` +
        `&search=${encodeURIComponent(search)}` +
        `&topic=${encodeURIComponent(topicFilter)}` +
        `&cefrLevel=${encodeURIComponent(cefrFilter)}` +
        `&published=${encodeURIComponent(publishedFilter)}`

      const [catalogResponse, settingsResponse] = await Promise.all([
        fetch(catalogUrl, {
          cache: "no-store"
        }),
        fetch("/api/admin/settings", {
          cache: "no-store"
        })
      ])

      if (!catalogResponse.ok || !settingsResponse.ok) {
        throw new Error("Could not load the catalog.")
      }

      return {
        catalog: (await catalogResponse.json()) as AdminCatalogPayload,
        settings: (await settingsResponse.json()) as AdminSettingsPayload
      }
    },
    onError: () => {
      showToast("Could not load the catalog.", "error")
    }
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setPayload(data.catalog)
    setSettingsLimit(String(data.settings.settings.dailyNewCardsLimit))
  }, [data])

  function resetForm() {
    setForm(emptyForm)
    setEditingItemId(null)
  }

  function updateForm<Key extends keyof CatalogFormState>(key: Key, value: CatalogFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }))
  }

  async function handleAutofill() {
    if (!form.word.trim()) {
      showToast("Enter a word first.", "error")
      return
    }

    setAutofilling(true)

    try {
      const [translationResponse, dictionaryResponse] = await Promise.all([
        fetch(
          `/api/translate?q=${encodeURIComponent(form.word.trim())}&langpair=${encodeURIComponent("en|ru")}`,
          {
            cache: "no-store"
          }
        ),
        fetch(`/api/dictionary?word=${encodeURIComponent(form.word.trim())}`, {
          cache: "no-store"
        })
      ])

      if (translationResponse.ok) {
        const payload = (await translationResponse.json()) as TranslationPayload
        if (payload.translation && !form.translation.trim()) {
          updateForm("translation", payload.translation)
        }
      }

      if (dictionaryResponse.ok) {
        const payload = (await dictionaryResponse.json()) as DictionaryPayload

        if (payload.example && !form.example.trim()) {
          updateForm("example", payload.example)
        }

        if (payload.phonetic && !form.phonetic.trim()) {
          updateForm("phonetic", payload.phonetic)
        }
      }

      showToast("Word details updated.", "success")
    } catch {
      showToast("Could not auto-fill this word.", "error")
    } finally {
      setAutofilling(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)

    try {
      const response = await fetch(
        editingItemId ? `/api/admin/catalog/${editingItemId}` : "/api/admin/catalog",
        {
          method: editingItemId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            word: form.word,
            translation: form.translation,
            cefrLevel: form.cefrLevel,
            partOfSpeech: form.partOfSpeech,
            topic: form.topic,
            example: form.example,
            phonetic: form.phonetic,
            priority: Number(form.priority || "0"),
            isPublished: form.isPublished
          })
        }
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not save the word.")
      }

      const saved = (await response.json()) as {
        item: WordCatalogRecord
      }

      setPayload((current) => {
        if (!current) {
          return current
        }

        const existingItems = editingItemId
          ? current.items.map((item) => (item.id === saved.item.id ? saved.item : item))
          : [saved.item, ...current.items].slice(0, 50)

        return {
          ...current,
          items: existingItems,
          totalItems: editingItemId ? current.totalItems : current.totalItems + 1
        }
      })

      resetForm()
      showToast(editingItemId ? "Catalog word updated." : "Catalog word created.", "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save the word.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTogglePublished(item: WordCatalogRecord) {
    try {
      const response = await fetch(`/api/admin/catalog/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isPublished: !item.isPublished
        })
      })

      if (!response.ok) {
        throw new Error("Could not update publish status.")
      }

      const payload = (await response.json()) as {
        item: WordCatalogRecord
      }

      setPayload((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) => (entry.id === payload.item.id ? payload.item : entry))
            }
          : current
      )
      showToast(payload.item.isPublished ? "Word published." : "Word moved to draft.", "success")
    } catch {
      showToast("Could not update publish status.", "error")
    }
  }

  async function handleSaveLimit() {
    setSavingLimit(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dailyNewCardsLimit: Number(settingsLimit)
        })
      })

      if (!response.ok) {
        throw new Error("Could not save the daily limit.")
      }

      const payload = (await response.json()) as AdminSettingsPayload
      setSettingsLimit(String(payload.settings.dailyNewCardsLimit))
      showToast("Daily limit updated.", "success")
    } catch {
      showToast("Could not save the daily limit.", "error")
    } finally {
      setSavingLimit(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="panel-admin rounded-[2rem] p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div>
              <p className="section-label">Word catalog</p>
              <h1 className="mt-2 text-[26px] font-bold tracking-[-0.5px] text-ink">
                Build the shared word bank
              </h1>
              <p className="mt-2 text-sm text-muted">
                Add curated words once, then let learners claim them manually by CEFR level.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={form.word}
                onChange={(event) => updateForm("word", event.target.value)}
                placeholder="Word"
                className="input-field"
              />
              <input
                value={form.translation}
                onChange={(event) => updateForm("translation", event.target.value)}
                placeholder="Translation"
                className="input-field"
              />
              <select
                value={form.cefrLevel}
                onChange={(event) => updateForm("cefrLevel", event.target.value as CefrLevel)}
                className="input-field"
              >
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <input
                value={form.partOfSpeech}
                onChange={(event) => updateForm("partOfSpeech", event.target.value)}
                placeholder="Part of speech"
                className="input-field"
              />
              <input
                value={form.topic}
                onChange={(event) => updateForm("topic", event.target.value)}
                placeholder="Topic"
                className="input-field"
              />
              <input
                value={form.priority}
                onChange={(event) => updateForm("priority", event.target.value)}
                placeholder="Priority"
                inputMode="numeric"
                className="input-field"
              />
            </div>

            <textarea
              value={form.example}
              onChange={(event) => updateForm("example", event.target.value)}
              placeholder="Example sentence"
              rows={3}
              className="input-field min-h-[110px] resize-y"
            />
            <input
              value={form.phonetic}
              onChange={(event) => updateForm("phonetic", event.target.value)}
              placeholder="Phonetic"
              className="input-field"
            />

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => updateForm("isPublished", event.target.checked)}
                />
                Published
              </label>
              <button
                type="button"
                onClick={() => void handleAutofill()}
                disabled={autofilling}
                className="button-secondary"
              >
                {autofilling ? "Auto-filling..." : "Auto-fill"}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="button-primary"
              >
                {submitting
                  ? "Saving..."
                  : editingItemId
                    ? "Update word"
                    : "Create word"}
              </button>
              {editingItemId ? (
                <button type="button" onClick={resetForm} className="button-secondary">
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-card border border-line bg-white/60 p-4">
            <p className="section-label">Daily limit</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">Global new words per day</h2>
            <p className="mt-2 text-sm text-muted">
              This limit applies to every learner when they claim today&apos;s words.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <input
                value={settingsLimit}
                onChange={(event) => setSettingsLimit(event.target.value)}
                inputMode="numeric"
                className="input-field"
              />
              <button
                type="button"
                onClick={() => void handleSaveLimit()}
                disabled={savingLimit}
                className="button-primary"
              >
                {savingLimit ? "Saving..." : "Save daily limit"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <AdminTable
        title="Catalog words"
        subtitle="Search, filter, and publish the shared bank."
        actions={
          <div className="grid w-full gap-2 md:w-auto md:grid-cols-4">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search"
              className="input-field"
            />
            <input
              value={topicFilter}
              onChange={(event) => {
                setTopicFilter(event.target.value)
                setPage(1)
              }}
              placeholder="Topic"
              className="input-field"
            />
            <select
              value={cefrFilter}
              onChange={(event) => {
                setCefrFilter(event.target.value as "" | CefrLevel)
                setPage(1)
              }}
              className="input-field"
            >
              <option value="">All levels</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <select
              value={publishedFilter}
              onChange={(event) => {
                setPublishedFilter(event.target.value as "all" | "published" | "draft")
                setPage(1)
              }}
              className="input-field"
            >
              <option value="all">All states</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        }
      >
        {loading || !payload ? (
          <div className="skeleton h-80 rounded-[1.75rem]" />
        ) : (
          <div className={`space-y-4 transition-opacity ${refreshing ? "opacity-70" : "opacity-100"}`}>
            <div className="space-y-3 md:hidden">
              {payload.items.map((item) => (
                <article key={item.id} className="rounded-card border border-separator bg-bg-primary p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[17px] font-semibold text-text-primary">{item.word}</p>
                      <p className="text-[15px] text-text-secondary">{item.translation}</p>
                    </div>
                    <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-semibold text-text-secondary">
                      {item.cefrLevel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-text-secondary">{item.example}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-text-tertiary">
                    <div>Topic: {item.topic}</div>
                    <div>POS: {item.partOfSpeech}</div>
                    <div>Priority: {item.priority}</div>
                    <div>Status: {item.isPublished ? "Published" : "Draft"}</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItemId(item.id)
                        setForm({
                          word: item.word,
                          translation: item.translation,
                          cefrLevel: item.cefrLevel,
                          partOfSpeech: item.partOfSpeech,
                          topic: item.topic,
                          example: item.example,
                          phonetic: item.phonetic,
                          priority: String(item.priority),
                          isPublished: item.isPublished
                        })
                      }}
                      className="button-secondary flex-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleTogglePublished(item)}
                      className="button-secondary flex-1"
                    >
                      {item.isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden min-w-full text-left text-sm md:table">
              <thead className="text-quiet">
                <tr>
                  {["Word", "Translation", "Level", "Topic", "Priority", "Status", "Updated", "Actions"].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.items.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-3 py-4 font-medium text-ink">{item.word}</td>
                    <td className="px-3 py-4 text-muted">{item.translation}</td>
                    <td className="px-3 py-4 text-muted">{item.cefrLevel}</td>
                    <td className="px-3 py-4 text-muted">{item.topic}</td>
                    <td className="px-3 py-4 text-muted">{item.priority}</td>
                    <td className="px-3 py-4 text-muted">{item.isPublished ? "Published" : "Draft"}</td>
                    <td className="px-3 py-4 text-muted">{formatTimestamp(item.updatedAt)}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId(item.id)
                            setForm({
                              word: item.word,
                              translation: item.translation,
                              cefrLevel: item.cefrLevel,
                              partOfSpeech: item.partOfSpeech,
                              topic: item.topic,
                              example: item.example,
                              phonetic: item.phonetic,
                              priority: String(item.priority),
                              isPublished: item.isPublished
                            })
                          }}
                          className="button-secondary px-3 py-2 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTogglePublished(item)}
                          className="button-secondary px-3 py-2 text-xs font-medium"
                        >
                          {item.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted">
                Page {payload.page} of {payload.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page === 1}
                  className="button-secondary"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, payload.totalPages))}
                  disabled={page >= payload.totalPages}
                  className="button-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminTable>
    </div>
  )
}

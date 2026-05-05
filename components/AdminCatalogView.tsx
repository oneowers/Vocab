"use client"

import { useEffect, useState } from "react"
import { EyeOff, Globe, Pencil, Sparkles } from "lucide-react"

import { AppleCard } from "@/components/AppleDashboardComponents"
import {
  AdminPagination,
  AdminPillButton,
  AdminSearchInput
} from "@/components/admin/AdminAppleUI"
import { AdminTable } from "@/components/AdminTable"
import { AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeletons"
import { Modal } from "@/components/Modal"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { CEFR_LEVELS } from "@/lib/catalog"
import { formatTimestamp } from "@/lib/date"
import type {
  AdminCatalogPayload,
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

function getStylesForCEFRLevel(level: CefrLevel) {
  switch (level) {
    case "A1":
    case "A2":
      return "bg-green-500/10 text-green-600 border border-green-500/20"
    case "B1":
    case "B2":
      return "bg-blue-500/10 text-blue-600 border border-blue-500/20"
    case "C1":
    case "C2":
      return "bg-purple-500/10 text-purple-600 border border-purple-500/20"
    default:
      return "bg-bg-secondary text-text-tertiary border border-separator"
  }
}

export function AdminCatalogView() {
  const [payload, setPayload] = useState<AdminCatalogPayload | null>(null)
  const [search, setSearch] = useState("")
  const [cefrFilter, setCefrFilter] = useState<"" | CefrLevel>("")
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all")
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<CatalogFormState>(emptyForm)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [autofilling, setAutofilling] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { showToast } = useToast()
  const { data, loading, refreshing } = useClientResource<AdminCatalogPayload>({
    key: `admin-catalog:${page}:${search}:${cefrFilter}:${publishedFilter}`,
    loader: async () => {
      const catalogUrl =
        `/api/admin/catalog?page=${page}` +
        `&search=${encodeURIComponent(search)}` +
        `&cefrLevel=${encodeURIComponent(cefrFilter)}` +
        `&published=${encodeURIComponent(publishedFilter)}`

      const catalogResponse = await fetch(catalogUrl, {
        cache: "no-store"
      })

      if (!catalogResponse.ok) {
        throw new Error("Could not load the catalog.")
      }

      return (await catalogResponse.json()) as AdminCatalogPayload
    },
    onError: () => {
      showToast("Could not load the catalog.", "error")
    }
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setPayload(data)
  }, [data])

  function resetForm() {
    setEditingItemId(null)
    setForm(emptyForm)
    setIsFormOpen(false)
  }

  function updateForm<Key extends keyof CatalogFormState>(key: Key, value: CatalogFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }))
  }

  async function handleAutofill(wordOverride?: string) {
    const word = (wordOverride || form.word).trim()
    if (!word) {
      showToast("Enter a word first.", "error")
      return
    }

    setAutofilling("form")

    try {
      const [translationResponse, dictionaryResponse] = await Promise.all([
        fetch(
          `/api/translate?q=${encodeURIComponent(word)}&langpair=${encodeURIComponent("en|ru")}`,
          {
            cache: "no-store"
          }
        ),
        fetch(`/api/dictionary?word=${encodeURIComponent(word)}`, {
          cache: "no-store"
        })
      ])

      if (translationResponse.ok) {
        const payload = (await translationResponse.json()) as TranslationPayload
        if (payload.translation) {
          setForm((current) => ({
            ...current,
            translation: current.translation.trim() ? current.translation : payload.translation
          }))
        }
      }

      if (dictionaryResponse.ok) {
        const payload = (await dictionaryResponse.json()) as DictionaryPayload

        if (payload.example) {
          setForm((current) => ({
            ...current,
            example: current.example.trim() ? current.example : (payload.example || "")
          }))
        }

        if (payload.phonetic) {
          setForm((current) => ({
            ...current,
            phonetic: current.phonetic.trim() ? current.phonetic : (payload.phonetic || "")
          }))
        }
      }

      showToast("Word details updated.", "success")
    } catch {
      showToast("Could not auto-fill this word.", "error")
    } finally {
      setAutofilling(null)
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
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not update publish status.")
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
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not update publish status.",
        "error"
      )
    }
  }

  function startEditing(item: WordCatalogRecord) {
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
    setIsFormOpen(true)
  }

  async function startReview(item: WordCatalogRecord) {
    if (autofilling) return

    setAutofilling(item.id)

    try {
      const [translationResponse, dictionaryResponse] = await Promise.all([
        fetch(
          `/api/translate?q=${encodeURIComponent(item.word)}&langpair=${encodeURIComponent("en|ru")}`,
          { cache: "no-store" }
        ),
        fetch(`/api/dictionary?word=${encodeURIComponent(item.word)}`, {
          cache: "no-store"
        })
      ])

      let nextTranslation = item.translation
      let nextExample = item.example
      let nextPhonetic = item.phonetic

      if (translationResponse.ok) {
        const payload = (await translationResponse.json()) as TranslationPayload
        if (payload.translation && !nextTranslation.trim()) {
          nextTranslation = payload.translation
        }
      }

      if (dictionaryResponse.ok) {
        const payload = (await dictionaryResponse.json()) as DictionaryPayload
        if (payload.example && !nextExample.trim()) {
          nextExample = payload.example || ""
        }
        if (payload.phonetic && !nextPhonetic.trim()) {
          nextPhonetic = payload.phonetic || ""
        }
      }

      const response = await fetch(`/api/admin/catalog/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translation: nextTranslation,
          example: nextExample,
          phonetic: nextPhonetic,
          enrichmentStatus:
            nextTranslation.trim() && nextExample.trim() && nextPhonetic.trim()
              ? "completed"
              : "failed",
          enrichmentError:
            nextTranslation.trim() && nextExample.trim() && nextPhonetic.trim()
              ? null
              : "Missing translation, example, or phonetic after auto-fill."
        })
      })

      if (!response.ok) {
        throw new Error("Could not update the word.")
      }

      const saved = (await response.json()) as { item: WordCatalogRecord }

      setPayload((current) =>
        current
          ? {
            ...current,
            items: current.items.map((entry) => (entry.id === saved.item.id ? saved.item : entry))
          }
          : current
      )

      showToast("Word enriched and saved.", "success")
    } catch {
      showToast("Could not auto-fill this word.", "error")
    } finally {
      setAutofilling(null)
    }
  }

  return (
    <div className="space-y-4">
      <Modal
            open={isFormOpen}
            onClose={resetForm}
            title={editingItemId ? "Edit word" : "Add curated word"}
          >
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                    Word
                  </label>
                  <input
                    value={form.word}
                    onChange={(event) => updateForm("word", event.target.value)}
                    placeholder="jones"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                    Translation
                  </label>
                  <input
                    value={form.translation}
                    onChange={(event) => updateForm("translation", event.target.value)}
                    placeholder="джонс"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                    Level
                  </label>
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
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                    POS
                  </label>
                  <input
                    value={form.partOfSpeech}
                    onChange={(event) => updateForm("partOfSpeech", event.target.value)}
                    placeholder="nnp"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                    Topic
                  </label>
                  <input
                    value={form.topic}
                    onChange={(event) => updateForm("topic", event.target.value)}
                    placeholder="general"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                    Priority
                  </label>
                  <input
                    value={form.priority}
                    onChange={(event) => updateForm("priority", event.target.value)}
                    placeholder="10011"
                    inputMode="numeric"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                  Example Sentence
                </label>
                <textarea
                  value={form.example}
                  onChange={(event) => updateForm("example", event.target.value)}
                  placeholder="I’ve got a basketball jones!"
                  rows={3}
                  className="input-field min-h-[110px] resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                  Phonetic
                </label>
                <input
                  value={form.phonetic}
                  onChange={(event) => updateForm("phonetic", event.target.value)}
                  placeholder="/dʒoʊnz/"
                  className="input-field"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-[15px] font-medium text-text-secondary">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => updateForm("isPublished", event.target.checked)}
                    className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                  />
                  Published
                </label>

                <div className="ml-auto flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleAutofill()}
                    disabled={!!autofilling}
                    className="button-secondary px-5"
                  >
                    {autofilling === "form" ? "Auto-filling..." : "Auto-fill"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className="button-primary px-8"
                  >
                    {submitting ? "Saving..." : editingItemId ? "Update word" : "Create word"}
                  </button>
                  <button type="button" onClick={resetForm} className="button-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Modal>
      <AdminTable
        title="Catalog words"
        actions={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search - Full width on mobile */}
            <div className="w-full md:w-64">
              <AdminSearchInput
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search words..."
              />
            </div>

            {/* Filters & Add Button */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar md:overflow-visible">
              <select
                value={cefrFilter}
                onChange={(event) => {
                  setCefrFilter(event.target.value as "" | CefrLevel)
                  setPage(1)
                }}
                className="input-field w-24 px-2 text-sm flex-shrink-0"
              >
                <option value="">Levels</option>
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
                className="input-field w-28 px-2 text-sm flex-shrink-0"
              >
                <option value="all">Status</option>
                <option value="published">Pub.</option>
                <option value="draft">Draft</option>
              </select>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="button-primary h-9 min-h-0 whitespace-nowrap px-4 text-sm ml-auto md:ml-0 flex-shrink-0"
              >
                Add word
              </button>
            </div>
          </div>
        }
      >
        {loading || !payload ? <AdminTableSkeleton /> : (
          <div className={`space-y-4 transition-opacity ${refreshing ? "opacity-70" : "opacity-100"}`}>
            <AppleCard className="overflow-hidden p-0">
              {payload.items.map((item, index) => (
                <div key={item.id} className="relative px-4 py-3 md:px-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${item.isPublished ? "bg-green-500" : "bg-red-500"
                              }`}
                          />
                          <p className="truncate text-[15px] font-bold text-white">{item.word}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${getStylesForCEFRLevel(item.cefrLevel)}`}>
                          {item.cefrLevel}
                        </span>
                      </div>
                      <p className="truncate text-[13px] text-white/38">{item.translation || "—"}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void startReview(item)}
                        disabled={!!autofilling}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
                        title="Autofill"
                      >
                        {autofilling === item.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTogglePublished(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary text-text-primary transition-colors hover:bg-bg-tertiary"
                        title={item.isPublished ? "Unpublish" : "Publish"}
                      >
                        {item.isPublished ? <EyeOff size={14} /> : <Globe size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-secondary text-text-primary transition-colors hover:bg-bg-tertiary"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                  {item.enrichmentError ? (
                    <p className="mt-2 text-[10px] text-dangerText">{item.enrichmentError}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-white/34">
                    <span>{item.isPublished ? "Published" : "Draft"}</span>
                    <span>{item.topic || "General"}</span>
                    <span>{formatTimestamp(item.updatedAt)}</span>
                  </div>
                  {index !== payload.items.length - 1 ? (
                    <div className="absolute bottom-0 right-0 h-px bg-white/[0.06]" style={{ left: "20px" }} />
                  ) : null}
                </div>
              ))}
            </AppleCard>

            <AdminPagination
              page={payload.page}
              totalPages={payload.totalPages}
              onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
              onNext={() => setPage((current) => Math.min(current + 1, payload.totalPages))}
            />
          </div>
        )}
      </AdminTable>
    </div>
  )
}

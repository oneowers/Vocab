"use client"

import { useEffect, useState } from "react"
import { Pencil, Power, PowerOff } from "lucide-react"

import { AdminTable } from "@/components/AdminTable"
import { Modal } from "@/components/Modal"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { CEFR_LEVELS } from "@/lib/catalog"
import { formatTimestamp } from "@/lib/date"
import type { AdminGrammarTopicsPayload, CefrLevel, GrammarTopicRecord } from "@/lib/types"

interface GrammarTopicFormState {
  key: string
  titleEn: string
  titleRu: string
  category: string
  cefrLevel: CefrLevel
  description: string
  examples: string
  isActive: boolean
}

const emptyForm: GrammarTopicFormState = {
  key: "",
  titleEn: "",
  titleRu: "",
  category: "",
  cefrLevel: "A1",
  description: "",
  examples: "",
  isActive: true
}

function parseExamples(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function examplesToText(value: string[]) {
  return value.join("\n")
}

export function AdminGrammarTopicsView() {
  const { showToast } = useToast()
  const [payload, setPayload] = useState<AdminGrammarTopicsPayload | null>(null)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<GrammarTopicFormState>(emptyForm)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { data, loading, refreshing } = useClientResource<AdminGrammarTopicsPayload>({
    key: `admin-grammar-topics:${page}:${search}:${activeFilter}`,
    loader: async () => {
      const response = await fetch(
        `/api/admin/grammar-topics?page=${page}` +
          `&search=${encodeURIComponent(search)}` +
          `&active=${encodeURIComponent(activeFilter)}`,
        { cache: "no-store" }
      )

      if (!response.ok) {
        throw new Error("Could not load grammar topics.")
      }

      return (await response.json()) as AdminGrammarTopicsPayload
    },
    onError: () => {
      showToast("Could not load grammar topics.", "error")
    }
  })

  useEffect(() => {
    if (data) {
      setPayload(data)
    }
  }, [data])

  function resetForm() {
    setEditingItemId(null)
    setForm(emptyForm)
    setIsFormOpen(false)
  }

  function updateForm<Key extends keyof GrammarTopicFormState>(
    key: Key,
    value: GrammarTopicFormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }))
  }

  function startEditing(item: GrammarTopicRecord) {
    setEditingItemId(item.id)
    setForm({
      key: item.key,
      titleEn: item.titleEn,
      titleRu: item.titleRu,
      category: item.category,
      cefrLevel: item.cefrLevel,
      description: item.description,
      examples: examplesToText(item.examples),
      isActive: item.isActive
    })
    setIsFormOpen(true)
  }

  async function handleSubmit() {
    setSubmitting(true)

    try {
      const response = await fetch(
        editingItemId ? `/api/admin/grammar-topics/${editingItemId}` : "/api/admin/grammar-topics",
        {
          method: editingItemId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            key: form.key,
            titleEn: form.titleEn,
            titleRu: form.titleRu,
            category: form.category,
            cefrLevel: form.cefrLevel,
            description: form.description,
            examples: parseExamples(form.examples),
            isActive: form.isActive
          })
        }
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not save grammar topic.")
      }

      const saved = (await response.json()) as {
        item: GrammarTopicRecord
      }

      setPayload((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          items: editingItemId
            ? current.items.map((item) => (item.id === saved.item.id ? saved.item : item))
            : [saved.item, ...current.items].slice(0, 50),
          totalItems: editingItemId ? current.totalItems : current.totalItems + 1
        }
      })

      resetForm()
      showToast(editingItemId ? "Grammar topic updated." : "Grammar topic created.", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not save grammar topic.",
        "error"
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(item: GrammarTopicRecord) {
    try {
      const response = await fetch(`/api/admin/grammar-topics/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isActive: !item.isActive
        })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not update grammar topic.")
      }

      const saved = (await response.json()) as {
        item: GrammarTopicRecord
      }

      setPayload((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) => (entry.id === saved.item.id ? saved.item : entry))
            }
          : current
      )
      showToast(saved.item.isActive ? "Grammar topic activated." : "Grammar topic deactivated.", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not update grammar topic.",
        "error"
      )
    }
  }

  return (
    <div className="space-y-4">
      <section className="panel-admin rounded-[2rem] p-5">
        <p className="section-label">Grammar Topics</p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.5px] text-ink">
          Manage grammar skill tracking
        </h1>
        <p className="mt-2 text-sm text-muted">
          Active topics are sent to AI writing checks and used for learner weak-point tracking.
        </p>

        <Modal
          open={isFormOpen}
          onClose={resetForm}
          title={editingItemId ? "Edit grammar topic" : "Add grammar topic"}
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Key</span>
                <input
                  value={form.key}
                  onChange={(event) => updateForm("key", event.target.value)}
                  placeholder="present_simple"
                  className="input-field"
                />
              </label>
              <label className="space-y-1.5">
                <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Category</span>
                <input
                  value={form.category}
                  onChange={(event) => updateForm("category", event.target.value)}
                  placeholder="tenses"
                  className="input-field"
                />
              </label>
              <label className="space-y-1.5">
                <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Title EN</span>
                <input
                  value={form.titleEn}
                  onChange={(event) => updateForm("titleEn", event.target.value)}
                  placeholder="Present Simple"
                  className="input-field"
                />
              </label>
              <label className="space-y-1.5">
                <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Title RU</span>
                <input
                  value={form.titleRu}
                  onChange={(event) => updateForm("titleRu", event.target.value)}
                  placeholder="Present Simple"
                  className="input-field"
                />
              </label>
              <label className="space-y-1.5">
                <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Level</span>
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
              </label>
              <label className="flex items-end gap-2 pb-3 text-[15px] font-medium text-text-secondary">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateForm("isActive", event.target.checked)}
                  className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                />
                Active
              </label>
            </div>

            <label className="space-y-1.5">
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                rows={3}
                className="input-field min-h-[96px] resize-y"
              />
            </label>

            <label className="space-y-1.5">
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Examples</span>
              <textarea
                value={form.examples}
                onChange={(event) => updateForm("examples", event.target.value)}
                rows={4}
                placeholder="One example per line"
                className="input-field min-h-[120px] resize-y"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" onClick={resetForm} className="button-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="button-primary"
              >
                {submitting ? "Saving..." : editingItemId ? "Update topic" : "Create topic"}
              </button>
            </div>
          </div>
        </Modal>
      </section>

      <AdminTable
        title="Grammar topics"
        subtitle="Create, edit, and activate the grammar areas AI is allowed to track."
        actions={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search topics..."
              className="input-field w-full md:w-72"
            />
            <div className="flex gap-2">
              <select
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(event.target.value as "all" | "active" | "inactive")
                  setPage(1)
                }}
                className="input-field w-32"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="button-primary whitespace-nowrap"
              >
                Add topic
              </button>
            </div>
          </div>
        }
      >
        {loading || !payload ? (
          <div className="skeleton h-80 rounded-[1.75rem]" />
        ) : (
          <div className={`space-y-4 transition-opacity ${refreshing ? "opacity-70" : "opacity-100"}`}>
            <div className="space-y-2 md:hidden">
              {payload.items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-separator bg-bg-primary p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{item.titleEn}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.key}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.isActive ? "bg-emerald-500/10 text-emerald-200" : "bg-white/[0.06] text-text-tertiary"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{item.description}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className="button-secondary h-9 min-h-0 px-3"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(item)}
                      className="button-secondary h-9 min-h-0 px-3"
                    >
                      {item.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      {item.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden min-w-full text-left text-sm md:table">
              <thead className="text-quiet">
                <tr>
                  {["Topic", "Category", "Level", "Status", "Updated", "Actions"].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-medium whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.items.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-ink">{item.titleEn}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.key}</p>
                    </td>
                    <td className="px-3 py-4 text-muted">{item.category}</td>
                    <td className="px-3 py-4 text-muted">{item.cefrLevel}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${item.isActive ? "bg-emerald-500/10 text-emerald-200" : "bg-white/[0.06] text-text-tertiary"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-xs text-muted">{formatTimestamp(item.updatedAt)}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="button-secondary flex h-8 w-8 items-center justify-center p-0"
                          title="Edit"
                          aria-label={`Edit ${item.titleEn}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(item)}
                          className="button-secondary flex h-8 w-8 items-center justify-center p-0"
                          title={item.isActive ? "Deactivate" : "Activate"}
                          aria-label={`${item.isActive ? "Deactivate" : "Activate"} ${item.titleEn}`}
                        >
                          {item.isActive ? <PowerOff size={14} /> : <Power size={14} />}
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

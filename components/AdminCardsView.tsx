"use client"

import { useEffect, useState } from "react"

import { AdminTable } from "@/components/AdminTable"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/components/Toast"
import { formatTimestamp } from "@/lib/date"
import type { AdminCardsPayload, CardRecord } from "@/lib/types"

export function AdminCardsView() {
  const [payload, setPayload] = useState<AdminCardsPayload | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CardRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadCards() {
      setLoading(true)

      try {
        const response = await fetch(
          `/api/admin/cards?page=${page}&search=${encodeURIComponent(search)}`,
          {
            cache: "no-store"
          }
        )

        if (!response.ok) {
          throw new Error("Could not load cards.")
        }

        setPayload((await response.json()) as AdminCardsPayload)
      } catch {
        showToast("Could not load cards.", "error")
      } finally {
        setLoading(false)
      }
    }

    void loadCards()
  }, [page, search, showToast])

  async function confirmDelete() {
    if (!selectedCard) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/cards/${selectedCard.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Delete failed.")
      }

      setPayload((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== selectedCard.id)
            }
          : current
      )
      setSelectedCard(null)
      showToast("Card deleted.", "success")
    } catch {
      showToast("Could not delete the card.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AdminTable
        title="Cards"
        subtitle="Search and manage cards across the app."
        actions={
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            placeholder="Search word or user email"
            className="input-field"
          />
        }
      >
        {loading || !payload ? (
          <div className="skeleton h-80 rounded-[1.75rem]" />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {payload.items.map((card) => (
                <article key={card.id} className="rounded-card border border-separator bg-bg-primary p-4">
                  <div className="space-y-1">
                    <p className="text-[17px] font-semibold text-text-primary">{card.original}</p>
                    <p className="text-[15px] text-text-secondary">{card.translation}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-text-tertiary">
                    <div>Direction: {card.direction}</div>
                    <div>Reviews: {card.reviewCount}</div>
                    <div>User: {card.userEmail || "—"}</div>
                    <div>Added: {formatTimestamp(card.dateAdded)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCard(card)}
                    className="button-secondary mt-4 w-full border-separator text-dangerText"
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>

            <table className="hidden min-w-full text-left text-sm md:table">
              <thead className="text-quiet">
                <tr>
                  {[
                    "Original",
                    "Translation",
                    "Direction",
                    "User email",
                    "Date added",
                    "Review count",
                    "Actions"
                  ].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.items.map((card) => (
                  <tr key={card.id} className="border-t border-line">
                    <td className="px-3 py-4 font-medium text-ink">{card.original}</td>
                    <td className="px-3 py-4 text-muted">{card.translation}</td>
                    <td className="px-3 py-4 text-muted">{card.direction}</td>
                    <td className="px-3 py-4 text-muted">{card.userEmail || "—"}</td>
                    <td className="px-3 py-4 text-muted">{formatTimestamp(card.dateAdded)}</td>
                    <td className="px-3 py-4 text-muted">{card.reviewCount}</td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedCard(card)}
                        className="button-secondary border-separator px-3 py-2 text-xs font-medium text-dangerText"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                  onClick={() =>
                    setPage((current) =>
                      Math.min(current + 1, payload.totalPages)
                    )
                  }
                  disabled={page >= payload.totalPages}
                  className="button-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </AdminTable>

      <ConfirmModal
        open={Boolean(selectedCard)}
        title="Delete card?"
        description={
          selectedCard
            ? `This removes "${selectedCard.original}" from the database.`
            : ""
        }
        onCancel={() => setSelectedCard(null)}
        onConfirm={() => void confirmDelete()}
        loading={submitting}
      />
    </>
  )
}

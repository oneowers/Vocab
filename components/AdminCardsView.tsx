"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"

import {
  AdminEmptyState,
  AdminPageIntro,
  AdminPagination,
  AdminPillButton,
  AdminSearchInput,
  AdminSurface
} from "@/components/admin/AdminAppleUI"
import { AdminTable } from "@/components/AdminTable"
import { AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeletons"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { formatTimestamp } from "@/lib/date"
import type { AdminCardsPayload, CardRecord } from "@/lib/types"

export function AdminCardsView() {
  const [payload, setPayload] = useState<AdminCardsPayload | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedCard, setSelectedCard] = useState<CardRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const { data, loading, refreshing } = useClientResource<AdminCardsPayload>({
    key: `admin-cards:${page}:${search}`,
    loader: async () => {
      const response = await fetch(
        `/api/admin/cards?page=${page}&search=${encodeURIComponent(search)}`,
        {
          cache: "no-store"
        }
      )

      if (!response.ok) {
        throw new Error("Could not load cards.")
      }

      return (await response.json()) as AdminCardsPayload
    },
    onError: () => {
      showToast("Could not load cards.", "error")
    }
  })

  useEffect(() => {
    if (data) {
      setPayload(data)
    }
  }, [data])

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
      <AdminPageIntro
        title="Card Registry"
        description="Search across the full vocabulary base, inspect ownership, and remove broken or unwanted records without leaving the admin deck."
      />

      <AdminTable
        title="Cards"
        subtitle="Search and manage cards across the app."
        actions={
          <AdminSearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            placeholder="Search word or user email"
          />
        }
      >
        {loading || !payload ? <AdminTableSkeleton /> : payload.items.length === 0 ? (
          <AdminEmptyState
            title="No cards matched"
            description="Try another search to locate a word, translation, or account email."
          />
        ) : (
          <div className={`transition-opacity ${refreshing ? "opacity-70" : "opacity-100"}`}>
            <div className="space-y-3 md:hidden">
              {payload.items.map((card) => (
                <AdminSurface key={card.id} className="p-4">
                  <div className="space-y-1">
                    <p className="text-[17px] font-semibold text-white">{card.original}</p>
                    <p className="text-[15px] text-white/44">{card.translation}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-white/40">
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
                </AdminSurface>
              ))}
            </div>

            <table className="hidden min-w-full text-left text-sm md:table">
              <thead className="text-white/34">
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
                    <td className="px-3 py-4 font-medium text-white">{card.original}</td>
                    <td className="px-3 py-4 text-white/48">{card.translation}</td>
                    <td className="px-3 py-4 text-white/48">{card.direction}</td>
                    <td className="px-3 py-4 text-white/48">{card.userEmail || "—"}</td>
                    <td className="px-3 py-4 text-white/48">{formatTimestamp(card.dateAdded)}</td>
                    <td className="px-3 py-4 text-white/48">{card.reviewCount}</td>
                    <td className="px-3 py-4">
                      <AdminPillButton type="button" tone="danger" onClick={() => setSelectedCard(card)} className="h-9 px-3 text-xs">
                        <Trash2 size={14} />
                        Delete
                      </AdminPillButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <AdminPagination
              page={payload.page}
              totalPages={payload.totalPages}
              onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
              onNext={() => setPage((current) => Math.min(current + 1, payload.totalPages))}
            />
          </div>
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

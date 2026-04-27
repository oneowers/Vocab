"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type ChangeEvent } from "react"

import { CardList } from "@/components/CardList"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/components/Toast"
import { getTodayDateKey } from "@/lib/date"
import { getGuestCards, isGuestSessionActive } from "@/lib/guest"
import { matchesCardStatus, sortDueCards } from "@/lib/spaced-repetition"
import type { CardRecord, CardsResponse, CardStatusFilter, CefrLevel, DailyCatalogStatus, DailyClaimResponse } from "@/lib/types"

export function CardsPageView() {
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<CardRecord[]>([])
  const [dailyCatalog, setDailyCatalog] = useState<DailyCatalogStatus | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<CardStatusFilter>("All")
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "All">("All")
  const [search, setSearch] = useState("")
  const [cardToDelete, setCardToDelete] = useState<CardRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const importRef = useRef<HTMLInputElement | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadCards() {
      const guestActive = isGuestSessionActive()
      setGuestMode(guestActive)

      if (guestActive) {
        setCards(sortDueCards(getGuestCards()))
        setDailyCatalog(null)
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/cards", {
          cache: "no-store"
        })

        if (!response.ok) {
          throw new Error("Could not load cards.")
        }

        const payload = (await response.json()) as CardsResponse
        setCards(sortDueCards(payload.cards))
        setDailyCatalog(payload.dailyCatalog)
      } catch {
        showToast("Could not load your deck.", "error")
      } finally {
        setLoading(false)
      }
    }

    void loadCards()
  }, [showToast])

  const visibleCards = cards.filter((card) => {
    const matchesStatus = matchesCardStatus(card, selectedStatus)
    const matchesLevel = selectedLevel === "All" || card.cefrLevel === selectedLevel
    const matchesSearch =
      !search.trim() ||
      card.original.toLowerCase().includes(search.trim().toLowerCase()) ||
      card.translation.toLowerCase().includes(search.trim().toLowerCase())

    return matchesStatus && matchesLevel && matchesSearch
  })
  const dueCount = cards.filter((card) => card.nextReviewDate <= getTodayDateKey()).length

  async function refreshCards() {
    if (guestMode) {
      setCards(sortDueCards(getGuestCards()))
      return
    }

    const response = await fetch("/api/cards", {
      cache: "no-store"
    })

    if (!response.ok) {
      throw new Error("Refresh failed.")
    }

    const payload = (await response.json()) as CardsResponse
    setCards(sortDueCards(payload.cards))
    setDailyCatalog(payload.dailyCatalog)
  }

  async function handleClaimDailyWords() {
    if (guestMode || claiming) {
      return
    }

    setClaiming(true)

    try {
      const response = await fetch("/api/cards/daily", {
        method: "POST"
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Could not add today&apos;s words.")
      }

      const payload = (await response.json()) as DailyClaimResponse

      setDailyCatalog({
        claimedToday: payload.claimedToday,
        dailyLimit: payload.dailyLimit,
        remainingToday: payload.remainingToday,
        cefrLevel: dailyCatalog?.cefrLevel ?? "A1"
      })

      if (payload.cards.length) {
        setCards((current) => sortDueCards([...payload.cards, ...current]))
        showToast(`${payload.createdCount} new word${payload.createdCount === 1 ? "" : "s"} added.`, "success")
        return
      }

      if (payload.limitReached) {
        showToast("Today's word limit is already reached.", "success")
        return
      }

      showToast("No more matching words are available for your level.", "error")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message.replace("&apos;", "'") : "Could not add today's words.",
        "error"
      )
    } finally {
      setClaiming(false)
    }
  }

  async function handleDeleteConfirmed() {
    if (!cardToDelete) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/cards/${cardToDelete.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(payload?.error || "Delete failed.")
      }

      setCards((current) => current.filter((card) => card.id !== cardToDelete.id))
      showToast("Card deleted.", "success")
      setCardToDelete(null)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not delete the card.",
        "error"
      )
    } finally {
      setDeleting(false)
    }
  }

  function handleExport() {
    if (!cards.length) {
      showToast("There are no cards to export yet.", "error")
      return
    }

    const blob = new Blob([JSON.stringify(cards, null, 2)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "wlingo-cards.json"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const importedCards = JSON.parse(text) as CardRecord[]

      for (const card of importedCards) {
        await fetch("/api/cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            original: card.original,
            translation: card.translation,
            direction: card.direction,
            example: card.example,
            phonetic: card.phonetic
          })
        })
      }

      await refreshCards()
      showToast("Cards imported.", "success")
    } catch {
      showToast("The import file is not valid JSON.", "error")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <>
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => void handleImportFile(event)}
      />

      <div className="space-y-4">
        <section className=" flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {!guestMode ? (
              <button
                type="button"
                onClick={() => void handleClaimDailyWords()}
                disabled={claiming || (dailyCatalog?.remainingToday ?? 0) === 0}
                className="button-secondary px-5 py-3 text-sm font-medium"
              >
                {claiming ? "Adding..." : "Get today's words"}
              </button>
            ) : null}
          </div>
        </section>

        {loading ? (
          <div className="skeleton h-96 rounded-card" />
        ) : (
          <CardList
            cards={visibleCards}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            search={search}
            onSearchChange={setSearch}
            onExport={handleExport}
            onImport={() => importRef.current?.click()}
            onDeleteRequest={setCardToDelete}
            guestMode={guestMode}
            variant="grid"
            title="All cards"
            description="Browse every saved card in a compact grid."
          />
        )}
      </div>

      <ConfirmModal
        open={Boolean(cardToDelete)}
        title="Delete this card?"
        description={
          cardToDelete
            ? `This will remove "${cardToDelete.original}" from the deck.`
            : ""
        }
        onCancel={() => setCardToDelete(null)}
        onConfirm={() => void handleDeleteConfirmed()}
        loading={deleting}
      />
    </>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type ChangeEvent } from "react"

import { CardList } from "@/components/CardList"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/components/Toast"
import { getTodayDateKey } from "@/lib/date"
import { getGuestCards, isGuestSessionActive } from "@/lib/guest"
import { sortDueCards } from "@/lib/spaced-repetition"
import type { CardRecord, CardsResponse } from "@/lib/types"

export function CardsPageView() {
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<CardRecord[]>([])
  const [selectedTag, setSelectedTag] = useState("All")
  const [search, setSearch] = useState("")
  const [cardToDelete, setCardToDelete] = useState<CardRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const importRef = useRef<HTMLInputElement | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadCards() {
      const guestActive = isGuestSessionActive()
      setGuestMode(guestActive)

      if (guestActive) {
        setCards(sortDueCards(getGuestCards()))
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
      } catch {
        showToast("Could not load your deck.", "error")
      } finally {
        setLoading(false)
      }
    }

    void loadCards()
  }, [showToast])

  const tagOptions = Array.from(new Set(cards.flatMap((card) => card.tags)))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))

  const visibleCards = cards.filter((card) => {
    const matchesTag = selectedTag === "All" || card.tags.includes(selectedTag)
    const matchesSearch =
      !search.trim() ||
      card.original.toLowerCase().includes(search.trim().toLowerCase()) ||
      card.translation.toLowerCase().includes(search.trim().toLowerCase())

    return matchesTag && matchesSearch
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
        throw new Error("Delete failed.")
      }

      setCards((current) => current.filter((card) => card.id !== cardToDelete.id))
      showToast("Card deleted.", "success")
      setCardToDelete(null)
    } catch {
      showToast("Could not delete the card.", "error")
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
    anchor.download = "wordflow-cards.json"
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
            phonetic: card.phonetic,
            tags: card.tags
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
        <section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Cards</p>
            <h1 className="mt-2 text-[22px] font-bold tracking-[-0.5px] text-text-primary">
              All saved cards
            </h1>
            <p className="mt-2 text-[15px] text-text-secondary">
              {dueCount} card{dueCount === 1 ? "" : "s"} ready for review.
            </p>
          </div>
          <Link href="/practice" className="button-primary inline-flex px-5 py-3 text-sm font-medium">
            Open practice
          </Link>
        </section>

        {loading ? (
          <div className="skeleton h-96 rounded-card" />
        ) : (
          <CardList
            cards={visibleCards}
            tags={tagOptions}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
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

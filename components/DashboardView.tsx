"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"

import { CardList } from "@/components/CardList"
import { ConfirmModal } from "@/components/ConfirmModal"
import { GuestBanner } from "@/components/GuestBanner"
import { TranslatorPanel } from "@/components/TranslatorPanel"
import { useToast } from "@/components/Toast"
import { getTodayDateKey } from "@/lib/date"
import { getGuestCards, isGuestSessionActive } from "@/lib/guest"
import { isMastered, sortDueCards } from "@/lib/spaced-repetition"
import type { CardRecord, CardsResponse, DashboardSummary } from "@/lib/types"

const EMPTY_SUMMARY: DashboardSummary = {
  streak: 0,
  totalCards: 0,
  dueToday: 0,
  mastered: 0
}

function buildSummary(cards: CardRecord[], streak: number) {
  const today = getTodayDateKey()
  return {
    streak,
    totalCards: cards.length,
    dueToday: cards.filter((card) => card.nextReviewDate <= today).length,
    mastered: cards.filter((card) => isMastered(card.reviewCount)).length
  }
}

export function DashboardView() {
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<CardRecord[]>([])
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY)
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
        const guestCards = sortDueCards(getGuestCards())
        setCards(guestCards)
        setSummary(buildSummary(guestCards, 0))
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
        setSummary(payload.summary)
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

  function updateCards(nextCards: CardRecord[]) {
    const sorted = sortDueCards(nextCards)
    setCards(sorted)
    setSummary((current) => buildSummary(sorted, current.streak))
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

      const nextCards = cards.filter((card) => card.id !== cardToDelete.id)
      updateCards(nextCards)
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

      const response = await fetch("/api/cards", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Refresh failed.")
      }

      const payload = (await response.json()) as CardsResponse
      setCards(sortDueCards(payload.cards))
      setSummary(payload.summary)
      showToast("Cards imported.", "success")
    } catch {
      showToast("The import file is not valid JSON.", "error")
    } finally {
      event.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-11 rounded-card" />
        <div className="skeleton min-h-[28rem] rounded-[20px]" />
        <div className="skeleton h-96 rounded-card" />
      </div>
    )
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
        <TranslatorPanel
          guestMode={guestMode}
          onAddCard={(card) => {
            const nextCards = [card, ...cards]
            updateCards(nextCards)
          }}
        />

        <GuestBanner />

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
        />
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

"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Flame } from "lucide-react"

import { CardList } from "@/components/CardList"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { getGuestCards, isGuestSessionActive } from "@/lib/guest"
import { matchesCardStatus, sortDueCards } from "@/lib/spaced-repetition"
import { getTodayDateKey, getYesterdayDateKey } from "@/lib/date"
import type { CardRecord, CardsResponse, CardStatusFilter, CefrLevel, AppUserRecord } from "@/lib/types"

interface CardsPageViewProps {
  initialData?: CardsResponse | null
  user?: AppUserRecord | null
}

export function CardsPageView({ initialData = null, user = null }: CardsPageViewProps) {
  const [guestMode, setGuestMode] = useState(false)
  const [cards, setCards] = useState<CardRecord[]>([])
  const [selectedStatus, setSelectedStatus] = useState<CardStatusFilter>("All")
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "All">("All")
  const [search, setSearch] = useState("")
  const [cardToDelete, setCardToDelete] = useState<CardRecord | null>(null)
  const [cardsToDelete, setCardsToDelete] = useState<CardRecord[]>([])
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const importRef = useRef<HTMLInputElement | null>(null)
  const { showToast } = useToast()
  const {
    data: cardsPayload,
    loading,
    refreshing,
    revalidate
  } = useClientResource<CardsResponse>({
    key: "cards:collection",
    enabled: !guestMode,
    initialData,
    revalidateOnMount: initialData === null,
    loader: async () => {
      const response = await fetch("/api/cards")

      if (!response.ok) {
        throw new Error("Could not load cards.")
      }

      return (await response.json()) as CardsResponse
    },
    onError: () => {
      showToast("Could not load your deck.", "error")
    }
  })

  useEffect(() => {
    setMounted(true)
    const guestActive = isGuestSessionActive()
    setGuestMode(guestActive)

    if (guestActive) {
      setCards(sortDueCards(getGuestCards()))
    }
  }, [])

  useEffect(() => {
    if (guestMode || !cardsPayload) {
      return
    }

    setCards(sortDueCards(cardsPayload.cards))
  }, [cardsPayload, guestMode])

  const visibleCards = cards.filter((card) => {
    const matchesStatus = matchesCardStatus(card, selectedStatus)
    const matchesLevel = selectedLevel === "All" || card.cefrLevel === selectedLevel
    const matchesSearch =
      !search.trim() ||
      card.original.toLowerCase().includes(search.trim().toLowerCase()) ||
      card.translation.toLowerCase().includes(search.trim().toLowerCase())

    return matchesStatus && matchesLevel && matchesSearch
  })

  async function refreshCards() {
    if (guestMode) {
      setCards(sortDueCards(getGuestCards()))
      return
    }

    await revalidate()
  }

  async function handleDeleteConfirmed() {
    if (!cardToDelete && !cardsToDelete.length) {
      return
    }

    setDeleting(true)

    try {
      const targets = cardsToDelete.length ? cardsToDelete : cardToDelete ? [cardToDelete] : []

      for (const card of targets) {
        const response = await fetch(`/api/cards/${card.id}`, {
          method: "DELETE"
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(payload?.error || "Delete failed.")
        }
      }

      const targetIds = new Set(targets.map((card) => card.id))
      setCards((current) => current.filter((card) => !targetIds.has(card.id)))
      showToast(targets.length === 1 ? "Card deleted." : `${targets.length} cards deleted.`, "success")
      setCardToDelete(null)
      setCardsToDelete([])
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not delete the selected cards.",
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
    anchor.download = "lexiflow-cards.json"
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
            translationAlternatives: card.translationAlternatives,
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

      <div className="pt-6 space-y-6">
        {mounted && user && (user.lastReviewDate !== getTodayDateKey() && user.lastReviewDate !== getYesterdayDateKey()) && user.lastStreakRecoveryDate !== getTodayDateKey() && (
          <div className="panel rounded-[28px] p-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame size={80} className="text-orange-500" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-ink">You’re back.</h3>
              <p className="mt-1 text-muted max-w-md">
                Let’s recover your progress in 3 minutes. Complete a quick review session to restore your streak.
              </p>
              <button 
                onClick={() => window.location.href = "/practice?mode=recovery"}
                className="mt-5 pill-glass bg-orange-500 text-white px-6 py-2.5 font-bold hover:scale-105 active:scale-95 transition-all"
              >
                Start Recovery Session
              </button>
            </div>
          </div>
        )}

        {cardsPayload?.dailyCatalog ? (
          <div className="panel rounded-[28px] p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3 md:gap-5">
              <div>
                <p className="section-label">Today</p>
                <p className="mt-1 text-[24px] font-bold tracking-[-0.04em] text-white">
                  {cardsPayload.dailyCatalog.todayCount} words
                </p>
              </div>
              <div className="h-10 w-px bg-white/[0.08]" />
              <div>
                <p className="section-label">Saved</p>
                <p className="mt-1 text-[18px] font-semibold text-white">
                  {cardsPayload.dailyCatalog.savedCount}
                </p>
              </div>
              <div>
                <p className="section-label">Waiting</p>
                <p className="mt-1 text-[18px] font-semibold text-text-secondary">
                  {cardsPayload.dailyCatalog.waitingCount}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="skeleton skeleton-soft h-8 w-52" />
              </div>
              <div className="skeleton dashboard-skeleton-card h-11 w-11 rounded-full" style={{ ["--skeleton-delay" as string]: "80ms" }} />
            </div>

            <div className="skeleton dashboard-skeleton-card rounded-[26px] p-3 md:p-4" style={{ ["--skeleton-delay" as string]: "120ms" }}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="skeleton skeleton-soft h-11 w-full max-w-sm rounded-[18px]" />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton skeleton-soft h-7 w-20" />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "A1", "A2", "B1", "B2"].map((label, index) => (
                      <div
                        key={label}
                        className="skeleton skeleton-soft h-7 w-12"
                        style={{ ["--skeleton-delay" as string]: `${160 + index * 30}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="skeleton dashboard-skeleton-card h-[148px] rounded-[26px]"
                  style={{ ["--skeleton-delay" as string]: `${180 + i * 45}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <CardList
            cards={visibleCards}
            refreshing={refreshing}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            search={search}
            onSearchChange={setSearch}
            onExport={handleExport}
            onImport={() => importRef.current?.click()}
            onDeleteRequest={setCardToDelete}
            onDeleteManyRequest={setCardsToDelete}
            guestMode={guestMode}
            variant="grid"
            title="Your saved cards"
          />
        )}
      </div>
    </div>

      <ConfirmModal
        open={Boolean(cardToDelete) || cardsToDelete.length > 0}
        title={cardsToDelete.length > 1 ? "Delete selected cards?" : "Delete this card?"}
        description={
          cardsToDelete.length
            ? `This will remove ${cardsToDelete.length} selected cards from the deck.`
            : cardToDelete
            ? `This will remove "${cardToDelete.original}" from the deck.`
            : ""
        }
        onCancel={() => {
          setCardToDelete(null)
          setCardsToDelete([])
        }}
        onConfirm={() => void handleDeleteConfirmed()}
        loading={deleting}
      />
    </>
  )
}

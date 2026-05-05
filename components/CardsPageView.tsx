"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Flame, User, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

import { CardList } from "@/components/CardList"
import { ConfirmModal } from "@/components/ConfirmModal"
import { StickySwitcherHeader } from "@/components/StickySwitcherHeader"
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const importRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
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

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (guestMode || !cardsPayload) {
      return
    }

    setCards(sortDueCards(cardsPayload.cards))
  }, [cardsPayload, guestMode])

  const todayKey = getTodayDateKey()
  const waitingCount = cards.filter((c) => c.nextReviewDate <= todayKey).length
  const learnedCount = cards.length - waitingCount
  const totalCount = cards.length

  useEffect(() => {
    if (waitingCount > 0 && selectedStatus === "All") {
      setSelectedStatus("Waiting")
    }
  }, [waitingCount])

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

      <div className="px-4 md:px-0 pt-1">
        <StickySwitcherHeader
          leftOption={{ label: "Due", value: "Waiting" }}
          rightOption={{ label: "Learned", value: "Learned" }}
          selectedValue={selectedStatus}
          onValueChange={(val) => setSelectedStatus(val as CardStatusFilter)}
          user={user}
          sticky={false}
        />

        <header className="flex flex-col gap-3 mb-6">
          <h1 className="text-[34px] font-bold tracking-tight text-white leading-tight">
            Cards
          </h1>
        </header>

        {mounted && user && (user.lastReviewDate !== getTodayDateKey() && user.lastReviewDate !== getYesterdayDateKey()) && user.lastStreakRecoveryDate !== getTodayDateKey() && (
          <div className="liquid-glass p-7 apple-spring relative overflow-hidden rounded-[32px]">
            <div className="absolute -right-6 -top-6 opacity-10 blur-3xl">
              <Flame size={140} className="text-[#FF9F0A]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FF9F0A]/20 text-[#FF9F0A]">
                  <Flame size={22} />
                </div>
                <h3 className="text-[20px] font-bold text-white tracking-tight">Streak at risk</h3>
              </div>
              <p className="mt-4 text-[15px] font-medium leading-relaxed text-white/60">
                Restore your progress in just <span className="text-[#FF9F0A]">3 minutes</span>. Complete this session to keep your streak alive.
              </p>
              <button
                onClick={() => window.location.href = "/practice?mode=recovery"}
                className="mt-8 flex h-12 items-center justify-center rounded-[12px] bg-[#FF9F0A] px-8 text-[15px] font-bold text-white apple-spring shadow-[0_8px_24px_rgba(255,159,10,0.3)]"
              >
                Start Recovery
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
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
              waitingCount={waitingCount}
              learnedCount={learnedCount}
              totalCount={totalCount}
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

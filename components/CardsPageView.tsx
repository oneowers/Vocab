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

      <div className="pt-6 pb-24 space-y-8">
        <header className="flex flex-col gap-6">
          <div className="flex items-start justify-between px-1">
            <div>
              <h1 className="text-[32px] font-black tracking-[-1.2px] text-white leading-none">
                Your cards
              </h1>
              <div className="mt-2 flex items-center gap-2 text-[13px] font-bold text-white/30">
                <span className="flex items-center gap-1">
                  <span className="text-white/60">{totalCount}</span> total
                </span>
                <span className="h-1 w-1 rounded-full bg-white/10" />
                <span className="flex items-center gap-1">
                  <span className="text-blue-400">{waitingCount}</span> waiting
                </span>
                <span className="h-1 w-1 rounded-full bg-white/10" />
                <span className="flex items-center gap-1">
                  <span className="text-emerald-400">{learnedCount}</span> learned
                </span>
              </div>
            </div>
            <button
              onClick={() => showToast("Menu coming soon", "info")}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-white/40 border border-white/10 active:scale-90 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
          </div>

          <div className="px-1">
            {waitingCount > 0 ? (
              <button
                onClick={() => window.location.href = "/review"}
                className="group relative flex h-[60px] w-full items-center justify-center overflow-hidden rounded-[20px] bg-white text-[#0a0c10] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/20 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative flex items-center gap-2 text-[16px] font-black uppercase tracking-wider">
                  Review {waitingCount} cards
                  <svg className="transition-transform group-hover:translate-x-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </span>
              </button>
            ) : (
              <div className="flex h-[60px] w-full items-center justify-center rounded-[20px] border border-white/[0.05] bg-white/[0.02] text-[15px] font-black text-white/20 uppercase tracking-widest">
                <svg className="mr-2 opacity-50" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                All caught up
              </div>
            )}
          </div>
        </header>

        {mounted && user && (user.lastReviewDate !== getTodayDateKey() && user.lastReviewDate !== getYesterdayDateKey()) && user.lastStreakRecoveryDate !== getTodayDateKey() && (
          <div className="relative overflow-hidden rounded-[32px] border border-orange-500/20 bg-[#1a120b] p-6 shadow-2xl">
            <div className="absolute -right-4 -top-4 opacity-10 blur-2xl">
              <Flame size={120} className="text-orange-500" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.08] to-transparent" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                  <Flame size={18} />
                </div>
                <h3 className="text-[18px] font-black text-white">Streak at risk</h3>
              </div>
              <p className="mt-3 text-[14px] font-bold leading-relaxed text-white/50">
                Restore your progress in just <span className="text-orange-400">3 minutes</span>. Complete this session to keep your streak alive.
              </p>
              <button
                onClick={() => window.location.href = "/practice?mode=recovery"}
                className="mt-6 flex h-11 items-center justify-center rounded-xl bg-orange-500 px-6 text-[14px] font-black uppercase tracking-wider text-white shadow-[0_10px_20px_rgba(249,115,22,0.2)] hover:scale-[1.05] active:scale-95 transition-all"
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

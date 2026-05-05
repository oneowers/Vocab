"use client"

import { useEffect, useState } from "react"

import { DailyWordsModal } from "@/components/DailyWordsModal"
import { TranslatorPanel } from "@/components/TranslatorPanel"
import { StreakCard } from "@/components/StreakCard"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import type { DailyCatalogStatus, DailyClaimResponse, AppUserRecord, ReviewSummaryPayload } from "@/lib/types"
import { getTodayDateKey, getYesterdayDateKey } from "@/lib/date"

interface DashboardViewProps {
  user: AppUserRecord
  initialDailyCatalog?: DailyCatalogStatus | null
}

export function DashboardView({ user, initialDailyCatalog = null }: DashboardViewProps) {
  const { showToast } = useToast()
  const [dailyCatalog, setDailyCatalog] = useState(initialDailyCatalog)
  const [dailyModalOpen, setDailyModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: cardsPayload } = useClientResource<ReviewSummaryPayload>({
    key: "review:summary",
    initialData: null,
    revalidateOnMount: true,
    staleTimeMs: 60_000,
    priority: "low",
    loader: async () => {
      const response = await fetch("/api/review/summary", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load deck status.")
      }

      return (await response.json()) as ReviewSummaryPayload
    }
  })

  useEffect(() => {
    setMounted(true)
    setDailyCatalog(initialDailyCatalog)
  }, [initialDailyCatalog])

  useEffect(() => {
    if (cardsPayload?.dailyCatalog) {
      setDailyCatalog((current) => current ?? cardsPayload.dailyCatalog)
    }
  }, [cardsPayload?.dailyCatalog])

  function handleClaimed(payload: DailyClaimResponse) {
    setDailyCatalog((current) => ({
      dailyTarget: payload.dailyTarget,
      todayCount: payload.todayCount,
      savedCount: payload.savedCount,
      waitingCount: payload.waitingCount,
      claimedToday: payload.claimedToday,
      dailyLimit: payload.dailyLimit,
      remainingToday: payload.remainingToday,
      cefrLevel: current?.cefrLevel ?? "A1"
    }))

    if (payload.cards.length) {
      showToast(`${payload.createdCount} word${payload.createdCount === 1 ? "" : "s"} added.`, "success")
      return
    }

    if (payload.limitReached) {
      showToast("Today's word limit is reached.", "success")
      return
    }

    showToast("No words were selected.", "error")
  }

  return (
    <div className="pb-24 px-4 md:px-0">
      <TranslatorPanel
        user={user}
        guestMode={false}
        onAddCard={() => { }}
        dailyCatalog={dailyCatalog}
        onOpenDailyWords={() => setDailyModalOpen(true)}
      />

      <DailyWordsModal
        open={dailyModalOpen}
        dailyCatalog={dailyCatalog}
        onClose={() => setDailyModalOpen(false)}
        onClaimed={handleClaimed}
      />
    </div>
  )
}

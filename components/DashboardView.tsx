"use client"

import { useEffect, useState } from "react"

import { DailyWordsModal } from "@/components/DailyWordsModal"
import { TranslatorPanel } from "@/components/TranslatorPanel"
import { StreakCard } from "@/components/StreakCard"
import { useToast } from "@/components/Toast"
import type { DailyCatalogStatus, DailyClaimResponse, AppUserRecord } from "@/lib/types"
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

  useEffect(() => {
    setMounted(true)
    setDailyCatalog(initialDailyCatalog)
  }, [initialDailyCatalog])

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

  const today = getTodayDateKey()
  const yesterday = getYesterdayDateKey(today)
  const isBroken = user.lastReviewDate !== today && user.lastReviewDate !== yesterday
  const hasRecoveredToday = user.lastStreakRecoveryDate === today

  return (
    <div className="translate-page-shell -mx-4 -my-4 px-4 py-2 md:-mx-8 md:-my-8 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
        <TranslatorPanel
          user={user}
          guestMode={false}
          onAddCard={() => { }}
          dailyCatalog={dailyCatalog}
          onOpenDailyWords={() => setDailyModalOpen(true)}
        />
      </div>

      <DailyWordsModal
        open={dailyModalOpen}
        dailyCatalog={dailyCatalog}
        onClose={() => setDailyModalOpen(false)}
        onClaimed={handleClaimed}
      />
    </div>
  )
}

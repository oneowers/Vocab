"use client"

import { useEffect, useState } from "react"
import { Flame } from "lucide-react"

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
    <div className="translate-page-shell -mx-4 -my-4 px-4 py-5 md:-mx-8 md:-my-8 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
        {mounted && isBroken && !hasRecoveredToday && (
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

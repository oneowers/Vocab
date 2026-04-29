"use client"

import { useEffect, useState } from "react"

import { DailyWordsModal } from "@/components/DailyWordsModal"
import { TranslatorPanel } from "@/components/TranslatorPanel"
import { useToast } from "@/components/Toast"
import type { DailyCatalogStatus, DailyClaimResponse } from "@/lib/types"

interface DashboardViewProps {
  initialDailyCatalog?: DailyCatalogStatus | null
}

export function DashboardView({ initialDailyCatalog = null }: DashboardViewProps) {
  const { showToast } = useToast()
  const [dailyCatalog, setDailyCatalog] = useState(initialDailyCatalog)
  const [dailyModalOpen, setDailyModalOpen] = useState(false)

  useEffect(() => {
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

  return (
    <div className="translate-page-shell -mx-4 -my-4 px-4 py-5 md:-mx-8 md:-my-8 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
        {dailyCatalog ? (
          <div className="panel rounded-[28px] p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3 md:gap-5">
              <div>
                <p className="section-label">Today</p>
                <p className="mt-1 text-[24px] font-bold tracking-[-0.04em] text-white">
                  {dailyCatalog.todayCount} words
                </p>
              </div>
              <div className="h-10 w-px bg-white/[0.08]" />
              <div>
                <p className="section-label">Saved</p>
                <p className="mt-1 text-[18px] font-semibold text-white">
                  {dailyCatalog.savedCount}
                </p>
              </div>
              <div>
                <p className="section-label">Waiting</p>
                <p className="mt-1 text-[18px] font-semibold text-text-secondary">
                  {dailyCatalog.waitingCount}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        <TranslatorPanel
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

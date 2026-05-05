"use client"

import { useSearchParams } from "next/navigation"

import { StatsFilter } from "@/components/StatsFilter"
import { useClientResource } from "@/hooks/useClientResource"
import type { DetailedStatsPayload, StatsSummaryPayload } from "@/lib/types"
import { RecentMistakesSkeleton } from "@/components/stats/RecentMistakesSkeleton"
import { StatsCardsSkeleton } from "@/components/stats/StatsCardsSkeleton"
import { Skeleton, SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"

function formatShortDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC"
  })
}

function formatDisplayDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })
}

function WeeklyProgressSkeleton() {
  return (
    <SkeletonCard className="rounded-[2rem] p-5">
      <SkeletonLine className="h-3 w-24 rounded-full" />
      <SkeletonLine className="mt-3 h-6 w-44 rounded-2xl" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
            <SkeletonLine className="h-3 w-8 rounded-full" />
            <Skeleton className="h-3 rounded-full" />
            <SkeletonLine className="h-3 w-6 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  )
}

function CefrBreakdownSkeleton() {
  return (
    <SkeletonCard className="rounded-[2rem] p-5">
      <SkeletonLine className="h-3 w-32 rounded-full" />
      <div className="mt-4 flex flex-wrap gap-2">
        {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
          <Skeleton key={level} className="h-10 w-[72px] rounded-full" />
        ))}
      </div>
    </SkeletonCard>
  )
}

export function DetailedStatsView() {
  const searchParams = useSearchParams()
  const range = searchParams.get("range") || "7d"
  const daysCount = range === "all" ? 365 : parseInt(range, 10) || 7

  const { data: summary, loading: summaryLoading } = useClientResource<StatsSummaryPayload>({
    key: `stats:summary:${daysCount}`,
    staleTimeMs: 60_000,
    loader: async () => {
      const response = await fetch(`/api/stats/summary?days=${daysCount}`, {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load stats summary.")
      }

      return (await response.json()) as StatsSummaryPayload
    }
  })
  const { data: weeklyProgress, loading: weeklyLoading } = useClientResource<DetailedStatsPayload["weeklyProgress"]>({
    key: `stats:weekly:${daysCount}`,
    staleTimeMs: 60_000,
    priority: "low",
    loader: async () => {
      const response = await fetch(`/api/stats/weekly?days=${daysCount}`, {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load weekly progress.")
      }

      return (await response.json()) as DetailedStatsPayload["weeklyProgress"]
    }
  })
  const { data: cardsByCefrLevel, loading: cefrLoading } = useClientResource<DetailedStatsPayload["cardsByCefrLevel"]>({
    key: "stats:cefr",
    staleTimeMs: 60_000,
    priority: "low",
    loader: async () => {
      const response = await fetch("/api/stats/cefr", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load CEFR breakdown.")
      }

      return (await response.json()) as DetailedStatsPayload["cardsByCefrLevel"]
    }
  })
  const { data: recentMistakes, loading: mistakesLoading } = useClientResource<DetailedStatsPayload["recentMistakes"]>({
    key: "stats:mistakes",
    staleTimeMs: 60_000,
    priority: "low",
    loader: async () => {
      const response = await fetch("/api/stats/mistakes", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load recent mistakes.")
      }

      return (await response.json()) as DetailedStatsPayload["recentMistakes"]
    }
  })

  const maxWeeklyValue = Math.max(1, ...(weeklyProgress ?? []).map((item) => item.value))
  const cefrEntries = cardsByCefrLevel ? Object.entries(cardsByCefrLevel) : []

  return (
    <div className="space-y-5">
      <StatsFilter />

      {summaryLoading && !summary ? <StatsCardsSkeleton /> : (
        <section className="grid grid-cols-3 gap-3">
          <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
              Cards learned
            </p>
            <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
              {summary?.totalCardsLearned ?? 0}
            </p>
          </article>
          <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
              Current streak
            </p>
            <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
              {summary?.currentStreak ?? 0}
            </p>
          </article>
          <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
              Active days
            </p>
            <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
              {summary?.activeDays ?? 0}
            </p>
          </article>
        </section>
      )}

      {weeklyLoading && !weeklyProgress ? <WeeklyProgressSkeleton /> : (
        <section className="panel rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Weekly progress</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Last 7 days reviews</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(weeklyProgress ?? []).map((item) => (
              <div key={item.date} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                <span className="text-sm font-semibold text-muted">{formatShortDay(item.date)}</span>
                <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width]"
                    style={{ width: `${(item.value / maxWeeklyValue) * 100}%` }}
                  />
                </div>
                <span className="min-w-6 text-right text-sm font-semibold text-ink">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {cefrLoading && !cardsByCefrLevel ? <CefrBreakdownSkeleton /> : (
        <section className="panel rounded-[2rem] p-5">
          <p className="section-label">Cards by CEFR level</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {cefrEntries.map(([level, count]) => (
              <span
                key={level}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-ink"
              >
                {level} ({count})
              </span>
            ))}
          </div>
        </section>
      )}

      {mistakesLoading && !recentMistakes ? <RecentMistakesSkeleton /> : (
        <section className="panel rounded-[2rem] p-5">
          <p className="section-label">Recent mistakes</p>
          <div className="mt-4 space-y-3">
            {recentMistakes?.length ? (
              recentMistakes.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[1.5rem] bg-white/[0.04] px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{item.word}</p>
                    <p className="mt-1 text-sm text-quiet">{formatDisplayDate(item.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-[var(--destructive-soft)] px-3 py-1 text-xs font-semibold text-[var(--destructive)]">
                    mistake
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No recent mistakes. Keep the streak going.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

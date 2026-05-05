"use client"

import { CheckCircle2, Layers, Users, Zap } from "lucide-react"

import { CSSBarChart } from "@/components/CSSBarChart"
import { SeedCatalogSection } from "@/components/SeedCatalogSection"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { formatTimestamp } from "@/lib/date"
import type { AdminAnalyticsPayload } from "@/lib/types"

export function AdminOverviewView() {
  const { showToast } = useToast()
  const { data, loading } = useClientResource<AdminAnalyticsPayload>({
    key: "admin:overview",
    loader: async () => {
      const response = await fetch("/api/admin/analytics", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load analytics.")
      }

      return (await response.json()) as AdminAnalyticsPayload
    },
    onError: () => {
      showToast("Could not load admin analytics.", "error")
    }
  })
  const weeklyDays = data?.days.slice(-7) ?? []

  if (loading || !data) {
    return null
  }

  const stats = [
    { label: "Total users", value: data.totals.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total cards", value: data.totals.totalCards, icon: Layers, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Total reviews", value: data.totals.totalReviews, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total sessions", value: data.totals.totalSessions, icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" }
  ]

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-4 gap-2 md:gap-4">
        {stats.map((item) => (
          <article key={item.label} className="panel-admin flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center md:items-start md:justify-start md:gap-3 md:rounded-[2rem] md:p-6 md:text-left">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl md:h-12 md:w-12 md:rounded-2xl ${item.bg} ${item.color}`}>
              <item.icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-wide text-quiet md:text-[11px] md:tracking-[0.15em]">
                {item.label.split(" ")[0]}
              </p>
              <p className="truncate text-lg font-bold text-ink md:mt-1 md:text-3xl">{item.value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-4 gap-2 md:gap-4">
        <article className="panel-admin flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center md:items-start md:justify-start md:gap-3 md:rounded-[2rem] md:p-6 md:text-left">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-quiet md:text-[11px] md:tracking-[0.15em]">
            Onboarding Completed
          </p>
          <p className="truncate text-lg font-bold text-ink md:mt-1 md:text-3xl">
            {data.onboarding.onboardingStarted ? Math.round((data.onboarding.onboardingCompleted / data.onboarding.onboardingStarted) * 100) : 0}%
          </p>
          <p className="text-xs text-muted">{data.onboarding.onboardingCompleted} / {data.onboarding.onboardingStarted}</p>
        </article>
        <article className="panel-admin flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center md:items-start md:justify-start md:gap-3 md:rounded-[2rem] md:p-6 md:text-left">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-quiet md:text-[11px] md:tracking-[0.15em]">
            First Practice Done
          </p>
          <p className="truncate text-lg font-bold text-ink md:mt-1 md:text-3xl">
            {data.onboarding.firstPracticeStarted ? Math.round((data.onboarding.firstPracticeCompleted / data.onboarding.firstPracticeStarted) * 100) : 0}%
          </p>
          <p className="text-xs text-muted">{data.onboarding.firstPracticeCompleted} / {data.onboarding.firstPracticeStarted}</p>
        </article>
        <article className="panel-admin flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center md:items-start md:justify-start md:gap-3 md:rounded-[2rem] md:p-6 md:text-left">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-quiet md:text-[11px] md:tracking-[0.15em]">
            D1 Return (Post-Practice)
          </p>
          <p className="truncate text-lg font-bold text-ink md:mt-1 md:text-3xl">
            {data.onboarding.firstPracticeCompleted ? Math.round((data.onboarding.firstPracticeD1Return / data.onboarding.firstPracticeCompleted) * 100) : 0}%
          </p>
          <p className="text-xs text-muted">{data.onboarding.firstPracticeD1Return} / {data.onboarding.firstPracticeCompleted}</p>
        </article>
        <article className="panel-admin flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center md:items-start md:justify-start md:gap-3 md:rounded-[2rem] md:p-6 md:text-left">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-quiet md:text-[11px] md:tracking-[0.15em]">
            AI Challenge Used
          </p>
          <p className="truncate text-lg font-bold text-ink md:mt-1 md:text-3xl">
            {data.onboarding.aiChallengeStarted ? Math.round((data.onboarding.aiChallengeCompleted / data.onboarding.aiChallengeStarted) * 100) : 0}%
          </p>
          <p className="text-xs text-muted">{data.onboarding.aiChallengeCompleted} / {data.onboarding.aiChallengeStarted}</p>
        </article>
      </section>

      <SeedCatalogSection data={data.seedCatalog} />

      <div className="grid gap-5 xl:grid-cols-2">
        <CSSBarChart
          title="New users per day"
          points={weeklyDays.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.newUsers
          }))}
          tone="gold"
          periodLabel="Last 7 days"
        />
        <CSSBarChart
          title="Review sessions per day"
          points={weeklyDays.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.totalSessions
          }))}
          tone="ink"
          periodLabel="Last 7 days"
        />
      </div>

      <section className="panel-admin rounded-[2rem] p-5">
        <h2 className="text-lg font-semibold text-ink">Recent activity</h2>
        <div className="mt-5 space-y-3">
          {data.recentActivity.map((item) => (
            <div key={item.id} className="rounded-[1.5rem] border border-separator bg-bg-primary px-4 py-4">
              <p className="font-medium text-ink">
                {item.email} reviewed <span className="font-semibold">{item.word}</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                {item.result === "known" ? "Known" : "Unknown"} • {formatTimestamp(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

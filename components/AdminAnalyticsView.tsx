"use client"

import { CSSBarChart } from "@/components/CSSBarChart"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import type { AdminAnalyticsPayload } from "@/lib/types"

export function AdminAnalyticsView() {
  const { showToast } = useToast()
  const { data, loading } = useClientResource<AdminAnalyticsPayload>({
    key: "admin:analytics",
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
      showToast("Could not load analytics.", "error")
    }
  })
  const weeklyDays = data?.days.slice(-7) ?? []

  if (loading || !data) {
    return <div className="skeleton h-[44rem] rounded-[2rem]" />
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total users", value: data.totals.totalUsers },
          { label: "Total cards", value: data.totals.totalCards },
          { label: "Total reviews", value: data.totals.totalReviews },
          { label: "Total sessions", value: data.totals.totalSessions }
        ].map((item) => (
          <article key={item.label} className="panel-admin rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-quiet">
              {item.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-ink">{item.value}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <CSSBarChart
          title="New users"
          points={weeklyDays.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.newUsers
          }))}
          tone="gold"
          periodLabel="Last 7 days"
        />
        <CSSBarChart
          title="New cards"
          points={weeklyDays.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.newCards
          }))}
          tone="green"
          periodLabel="Last 7 days"
        />
        <CSSBarChart
          title="Sessions"
          points={weeklyDays.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.totalSessions
          }))}
          tone="ink"
          periodLabel="Last 7 days"
        />
        <CSSBarChart
          title="Reviews"
          points={weeklyDays.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.totalReviews
          }))}
          tone="rose"
          periodLabel="Last 7 days"
        />
      </div>
    </div>
  )
}

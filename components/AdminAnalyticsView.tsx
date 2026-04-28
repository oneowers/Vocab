"use client"

import { CheckCircle2, Layers, Users, Zap } from "lucide-react"

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

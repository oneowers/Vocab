"use client"

import { useEffect, useState } from "react"

import { CSSBarChart } from "@/components/CSSBarChart"
import { useToast } from "@/components/Toast"
import type { AdminAnalyticsPayload } from "@/lib/types"

export function AdminAnalyticsView() {
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/admin/analytics", {
          cache: "no-store"
        })

        if (!response.ok) {
          throw new Error("Could not load analytics.")
        }

        setData((await response.json()) as AdminAnalyticsPayload)
      } catch {
        showToast("Could not load analytics.", "error")
      } finally {
        setLoading(false)
      }
    }

    void loadAnalytics()
  }, [showToast])

  if (loading || !data) {
    return <div className="skeleton h-[44rem] rounded-[2rem]" />
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CSSBarChart
          title="Total users"
          points={[{ date: "users", label: "Users", value: data.totals.totalUsers }]}
          tone="gold"
          heightClassName="h-28"
          summaryLabel="users"
        />
        <CSSBarChart
          title="Total cards"
          points={[{ date: "cards", label: "Cards", value: data.totals.totalCards }]}
          tone="green"
          heightClassName="h-28"
          summaryLabel="cards"
        />
        <CSSBarChart
          title="Total reviews"
          points={[{ date: "reviews", label: "Reviews", value: data.totals.totalReviews }]}
          tone="rose"
          heightClassName="h-28"
          summaryLabel="reviews"
        />
        <CSSBarChart
          title="Total sessions"
          points={[{ date: "sessions", label: "Sessions", value: data.totals.totalSessions }]}
          tone="ink"
          heightClassName="h-28"
          summaryLabel="sessions"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <CSSBarChart
          title="New users"
          points={data.days.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.newUsers
          }))}
          tone="gold"
          periodLabel="Last 30 days"
        />
        <CSSBarChart
          title="New cards"
          points={data.days.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.newCards
          }))}
          tone="green"
          periodLabel="Last 30 days"
        />
        <CSSBarChart
          title="Sessions"
          points={data.days.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.totalSessions
          }))}
          tone="ink"
          periodLabel="Last 30 days"
        />
        <CSSBarChart
          title="Reviews"
          points={data.days.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.totalReviews
          }))}
          tone="rose"
          periodLabel="Last 30 days"
        />
      </div>
    </div>
  )
}

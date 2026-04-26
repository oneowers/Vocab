"use client"

import { useEffect, useState } from "react"

import { CSSBarChart } from "@/components/CSSBarChart"
import { useToast } from "@/components/Toast"
import { formatTimestamp } from "@/lib/date"
import type { AdminAnalyticsPayload } from "@/lib/types"

export function AdminOverviewView() {
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await fetch("/api/admin/analytics", {
          cache: "no-store"
        })

        if (!response.ok) {
          throw new Error("Could not load analytics.")
        }

        setData((await response.json()) as AdminAnalyticsPayload)
      } catch {
        showToast("Could not load admin analytics.", "error")
      } finally {
        setLoading(false)
      }
    }

    void loadOverview()
  }, [showToast])

  if (loading || !data) {
    return <div className="skeleton h-[44rem] rounded-[2rem]" />
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total users", value: data.totals.totalUsers },
          { label: "Total cards", value: data.totals.totalCards },
          { label: "Reviews today", value: data.totals.reviewsToday },
          { label: "Active users (7 days)", value: data.totals.activeUsersLast7Days }
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
          title="New users per day"
          points={data.days.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.newUsers
          }))}
          tone="gold"
        />
        <CSSBarChart
          title="Review sessions per day"
          points={data.days.map((day) => ({
            date: day.date,
            label: day.label,
            value: day.totalSessions
          }))}
          tone="ink"
        />
      </div>

      <section className="panel-admin rounded-[2rem] p-5">
        <h2 className="text-lg font-semibold text-ink">Recent activity</h2>
        <div className="mt-5 space-y-3">
          {data.recentActivity.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.5rem] border border-line bg-white px-4 py-4"
            >
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


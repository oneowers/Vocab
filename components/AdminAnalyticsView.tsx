"use client"

import { BarChart3, CheckCircle2, Clock3, Layers, TrendingUp, Users, Zap } from "lucide-react"

import { CSSBarChart } from "@/components/CSSBarChart"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import type { AdminAnalyticsPayload } from "@/lib/types"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"

function HorizontalBars({
  title,
  items
}: {
  title: string
  items: Array<{ label: string; value: number }>
}) {
  const maxValue = Math.max(1, ...items.map((item) => item.value))

  return (
    <section className="panel-admin rounded-[2rem] p-5 bg-bg-secondary/40 border border-line backdrop-blur-sm">
      <h2 className="text-lg font-black text-ink mb-6 px-1">{title}</h2>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={items}
            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide domain={[0, maxValue]} />
            <YAxis 
              dataKey="label" 
              type="category" 
              width={40} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted)', fontSize: 12, fontWeight: 700 }}
            />
            <RechartsTooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2 shadow-xl backdrop-blur-md">
                      <p className="text-[14px] font-black text-white">{payload[0].value} mistakes</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar 
              dataKey="value" 
              fill="var(--accent)" 
              radius={[0, 4, 4, 0]} 
              barSize={12}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

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
  const retentionStats = [
    {
      label: "Day 1",
      value: data.retention.activeUsersD1,
      icon: Clock3,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10"
    },
    {
      label: "Day 7",
      value: data.retention.activeUsersD7,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      label: "Day 30",
      value: data.retention.activeUsersD30,
      icon: Users,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    }
  ]
  const cefrItems = Object.entries(data.wrongByCefr).map(([label, value]) => ({
    label,
    value
  }))
  const catalogStats = [
    {
      label: "Claims today",
      value: data.catalogEngagement.claimsToday,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      label: "Catalog ratio %",
      value: `${(data.catalogEngagement.catalogRatio * 100).toFixed(1)}%`,
      icon: BarChart3,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    }
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

      <section className="space-y-3">
        <div>
          <p className="section-label">Retention (day-1 / day-7 / day-30)</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Return activity snapshots</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {retentionStats.map((item) => (
            <article
              key={item.label}
              className="panel-admin flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center md:items-start md:justify-start md:gap-3 md:rounded-[2rem] md:p-6 md:text-left"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl md:h-12 md:w-12 md:rounded-2xl ${item.bg} ${item.color}`}>
                <item.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-wide text-quiet md:text-[11px] md:tracking-[0.15em]">
                  {item.label}
                </p>
                <p className="truncate text-lg font-bold text-ink md:mt-1 md:text-3xl">{item.value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <HorizontalBars title="Wrong answers by CEFR" items={cefrItems} />

      <section className="space-y-3">
        <div>
          <p className="section-label">Catalog engagement</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Catalog usage snapshot</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {catalogStats.map((item) => (
            <article
              key={item.label}
              className="panel-admin flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center md:items-start md:justify-start md:gap-3 md:rounded-[2rem] md:p-6 md:text-left"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl md:h-12 md:w-12 md:rounded-2xl ${item.bg} ${item.color}`}>
                <item.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-wide text-quiet md:text-[11px] md:tracking-[0.15em]">
                  {item.label}
                </p>
                <p className="truncate text-lg font-bold text-ink md:mt-1 md:text-3xl">{item.value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

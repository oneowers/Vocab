"use client"

import { BarChart3, CheckCircle2, Clock3, Layers, TrendingUp, Users, Zap } from "lucide-react"

import { AdminPageIntro, AdminStatCard, AdminStatGrid, AdminSurface } from "@/components/admin/AdminAppleUI"
import { CSSBarChart } from "@/components/CSSBarChart"
import { AdminStatsGridSkeleton } from "@/components/admin/AdminLoadingSkeletons"
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
    <AdminSurface className="border border-white/[0.06] bg-[#141416] p-5">
      <h2 className="mb-6 px-1 text-lg font-black text-white">{title}</h2>
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
    </AdminSurface>
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
    return (
      <div className="space-y-5">
        <AdminStatsGridSkeleton />
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-5" />
          <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-5" />
        </div>
      </div>
    )
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
      <AdminPageIntro
        title="Behavior Analytics"
        description="Follow acquisition, retention, catalog adoption, and weak spots with the same surface language across the whole admin console."
      />

      <AdminStatGrid>
        {stats.map((item) => (
          <AdminStatCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={<item.icon className="h-5 w-5 md:h-6 md:w-6" />}
            tone={`${item.bg} ${item.color}`}
          />
        ))}
      </AdminStatGrid>

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
          <h2 className="mt-1 text-lg font-semibold text-white">Return activity snapshots</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {retentionStats.map((item) => (
            <AdminStatCard
              key={item.label}
              label={item.label}
              value={item.value}
              icon={<item.icon className="h-5 w-5 md:h-6 md:w-6" />}
              tone={`${item.bg} ${item.color}`}
            />
          ))}
        </div>
      </section>

      <HorizontalBars title="Wrong answers by CEFR" items={cefrItems} />

      <section className="space-y-3">
        <div>
          <p className="section-label">Catalog engagement</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Catalog usage snapshot</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {catalogStats.map((item) => (
            <AdminStatCard
              key={item.label}
              label={item.label}
              value={item.value}
              icon={<item.icon className="h-5 w-5 md:h-6 md:w-6" />}
              tone={`${item.bg} ${item.color}`}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

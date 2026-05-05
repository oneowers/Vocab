"use client"

import { Activity, CheckCircle2, Flame, Layers, Users, Zap } from "lucide-react"

import { AppleCard, AppleListItem } from "@/components/AppleDashboardComponents"
import { AdminSurface } from "@/components/admin/AdminAppleUI"
import { AdminStatsGridSkeleton } from "@/components/admin/AdminLoadingSkeletons"
import { GrammarTrendChart } from "@/components/grammar/GrammarTrendChart"
import { SeedCatalogSection } from "@/components/SeedCatalogSection"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
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
    return (
      <div className="space-y-5">
        <AdminStatsGridSkeleton />
        <AdminStatsGridSkeleton />
      </div>
    )
  }

  const coreStats = [
    { label: "Total users", value: data.totals.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total cards", value: data.totals.totalCards, icon: Layers, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Total reviews", value: data.totals.totalReviews, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total sessions", value: data.totals.totalSessions, icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" }
  ]
  const onboardingStats = [
    {
      title: "Onboarding",
      value: `${data.onboarding.onboardingStarted ? Math.round((data.onboarding.onboardingCompleted / data.onboarding.onboardingStarted) * 100) : 0}%`,
      subtitle: `${data.onboarding.onboardingCompleted} / ${data.onboarding.onboardingStarted}`,
      icon: <CheckCircle2 size={18} />,
      iconColor: "bg-[#34C759]"
    },
    {
      title: "First Practice",
      value: `${data.onboarding.firstPracticeStarted ? Math.round((data.onboarding.firstPracticeCompleted / data.onboarding.firstPracticeStarted) * 100) : 0}%`,
      subtitle: `${data.onboarding.firstPracticeCompleted} / ${data.onboarding.firstPracticeStarted}`,
      icon: <Zap size={18} />,
      iconColor: "bg-[#FF9F0A]"
    },
    {
      title: "D1 Return",
      value: `${data.onboarding.firstPracticeCompleted ? Math.round((data.onboarding.firstPracticeD1Return / data.onboarding.firstPracticeCompleted) * 100) : 0}%`,
      subtitle: `${data.onboarding.firstPracticeD1Return} / ${data.onboarding.firstPracticeCompleted}`,
      icon: <Flame size={18} />,
      iconColor: "bg-[#FF453A]"
    },
    {
      title: "AI Challenge",
      value: `${data.onboarding.aiChallengeStarted ? Math.round((data.onboarding.aiChallengeCompleted / data.onboarding.aiChallengeStarted) * 100) : 0}%`,
      subtitle: `${data.onboarding.aiChallengeCompleted} / ${data.onboarding.aiChallengeStarted}`,
      icon: <Activity size={18} />,
      iconColor: "bg-[#BF5AF2]"
    }
  ]
  const newUsersTrend = weeklyDays.map((day) => ({ date: day.date, value: day.newUsers }))
  const reviewSessionsTrend = weeklyDays.map((day) => ({ date: day.date, value: day.totalSessions }))

  return (
    <div className="space-y-5">
      <AppleCard className="overflow-hidden p-0">
        {coreStats.map((item, index) => (
          <AppleListItem
            key={item.label}
            title={item.label}
            icon={<item.icon size={18} />}
            iconColor={item.bg.replace("/10", "")}
            rightLabel={item.value}
            showDivider={index !== coreStats.length - 1}
          />
        ))}
      </AppleCard>

      <AppleCard className="overflow-hidden p-0">
        {onboardingStats.map((item, index) => (
          <AppleListItem
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            iconColor={item.iconColor}
            rightLabel={item.value}
            showDivider={index !== onboardingStats.length - 1}
          />
        ))}
      </AppleCard>

      <SeedCatalogSection data={data.seedCatalog} />

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminSurface className="p-4">
          <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/30">New Users</p>
          <div className="mt-3">
            <GrammarTrendChart data={newUsersTrend} />
          </div>
        </AdminSurface>
        <AdminSurface className="p-4">
          <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/30">Review Sessions</p>
          <div className="mt-3">
            <GrammarTrendChart data={reviewSessionsTrend} />
          </div>
        </AdminSurface>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, LogOut, Shield } from "lucide-react"

import { useToast } from "@/components/Toast"
import { clearGuestSession, isGuestSessionActive } from "@/lib/guest"
import { getRoleLabel } from "@/lib/roles"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import type { AppUserRecord, ProfileActivityPayload } from "@/lib/types"

interface ProfileViewProps {
  user: AppUserRecord | null
  activity: ProfileActivityPayload
}

export function ProfileView({ user, activity }: ProfileViewProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [guestActive, setGuestActive] = useState(false)

  useEffect(() => {
    setGuestActive(isGuestSessionActive())
  }, [])

  async function handleExit() {
    if (guestActive) {
      clearGuestSession()
      router.push("/login")
      return
    }

    if (!user) {
      router.push("/login")
      return
    }

    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      showToast("Supabase is not configured yet.", "error")
      return
    }

    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const name = guestActive ? "Guest explorer" : user?.name || user?.email || "Wlingo user"
  const subtitle = guestActive
    ? "Guest mode"
    : getRoleLabel(user?.role ?? null)
  const heatmapDays = useMemo(() => activity.days, [activity.days])
  const heatmapCellSize = 12
  const heatmapGap = 4
  const heatmapWidth = 53 * heatmapCellSize + 52 * heatmapGap
  const visibleMonths = useMemo(() => {
    const minLabelSpacing = 28
    let lastLeft = -Infinity

    return activity.months.filter((month) => {
      const left = month.weekIndex * (heatmapCellSize + heatmapGap)

      if (left - lastLeft < minLabelSpacing) {
        return false
      }

      lastLeft = left
      return true
    })
  }, [activity.months])

  return (
    <div className="space-y-4">
      <section className="panel p-6">
        <p className="section-label">Profile</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-0.5px] text-text-primary">{name}</h1>
        <p className="mt-2 text-[15px] text-text-secondary">{subtitle}</p>
      </section>

      <section className="panel p-4">
        <div className="divide-y divide-separator">
          <div className="flex min-h-[52px] items-center justify-between py-1">
            <span className="text-[17px] font-semibold text-text-primary">Email</span>
            <span className="text-[15px] text-text-tertiary">{user?.email || "Guest session"}</span>
          </div>
          <div className="flex min-h-[52px] items-center justify-between py-1">
            <span className="text-[17px] font-semibold text-text-primary">Role</span>
            <span className="text-[15px] text-text-tertiary">{subtitle}</span>
          </div>
          {user?.role === "ADMIN" ? (
            <Link href="/admin" prefetch className="flex min-h-[52px] items-center justify-between py-1">
              <span className="inline-flex items-center gap-2 text-[17px] font-semibold text-text-primary">
                <Shield size={18} />
                Admin
              </span>
              <ArrowRight size={18} className="text-text-tertiary" />
            </Link>
          ) : null}
        </div>
      </section>

      <section className="panel p-4 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label">Activity</p>
            <h2 className="mt-2 text-[22px] font-bold tracking-[-0.5px] text-text-primary">
              {activity.activeDaysLastYear} active days in the last year
            </h2>
            <p className="mt-1 text-[15px] text-text-secondary">
              {guestActive
                ? "Guest mode does not keep a year-long activity history yet."
                : `${activity.totalReviewsLastYear} review attempts recorded across the past 12 months.`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-text-tertiary">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span key={level} className="activity-cell" data-level={level} aria-hidden="true" />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-1 hide-scrollbar native-scroll">
          <div className="min-w-[760px]">
            <div
              className="relative ml-12 h-6 text-[12px] leading-none text-text-tertiary"
              style={{ width: `${heatmapWidth}px` }}
            >
              {visibleMonths.map((month) => (
                <span
                  key={`${month.label}-${month.weekIndex}`}
                  className="absolute top-0"
                  style={{
                    left: `${month.weekIndex * (heatmapCellSize + heatmapGap)}px`
                  }}
                >
                  {month.label}
                </span>
              ))}
            </div>

            <div className="mt-3 flex gap-3">
              <div className="grid grid-rows-7 gap-1 pt-[1px] text-[12px] text-text-tertiary">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((label, index) => (
                  <span key={`${label}-${index}`} className="flex h-[12px] items-center">
                    {label}
                  </span>
                ))}
              </div>

              <div
                className="grid grid-flow-col grid-rows-7 gap-1"
                style={{ width: `${heatmapWidth}px` }}
              >
                {heatmapDays.map((day) => (
                  <div
                    key={day.date}
                    className="activity-cell"
                    data-level={day.level}
                    title={`${day.count} reviews on ${day.date}`}
                    aria-label={`${day.count} reviews on ${day.date}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <button type="button" onClick={handleExit} className="button-secondary w-full">
        <LogOut size={18} />
        {guestActive ? "Exit guest mode" : user ? "Sign out" : "Open login"}
      </button>
    </div>
  )
}

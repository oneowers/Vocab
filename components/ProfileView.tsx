"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Heart, LogOut, Shield } from "lucide-react"

import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { DEFAULT_GUEST_REVIEW_LIVES, clearGuestSession, isGuestSessionActive } from "@/lib/guest"
import { getRoleLabel } from "@/lib/roles"
import { buildEmptyProfileActivity } from "@/lib/server-data"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import type { AppUserRecord, ProfileActivityPayload } from "@/lib/types"

interface ProfileViewProps {
  user: AppUserRecord | null
}

export function ProfileView({ user }: ProfileViewProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [guestActive, setGuestActive] = useState(false)
  const [profileUser, setProfileUser] = useState(user)
  const [reviewLives, setReviewLives] = useState(user?.reviewLives ?? DEFAULT_GUEST_REVIEW_LIVES)
  const [savingLives, setSavingLives] = useState(false)
  const fallbackActivity = useMemo(() => buildEmptyProfileActivity(), [])
  const {
    data: activity,
    loading: activityLoading,
    refreshing: activityRefreshing
  } = useClientResource<ProfileActivityPayload>({
    key: guestActive || !profileUser ? "profile-activity:guest" : `profile-activity:${profileUser.id}`,
    enabled: true,
    initialData: guestActive || !profileUser ? fallbackActivity : null,
    loader: async () => {
      const response = await fetch("/api/profile/activity", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load activity.")
      }

      return (await response.json()) as ProfileActivityPayload
    },
    onError: () => {
      showToast("Could not load profile activity.", "error")
    }
  })

  useEffect(() => {
    setGuestActive(isGuestSessionActive())
  }, [])

  useEffect(() => {
    setProfileUser(user)
    setReviewLives(user?.reviewLives ?? DEFAULT_GUEST_REVIEW_LIVES)
  }, [user])

  async function handleExit() {
    if (guestActive) {
      clearGuestSession()
      router.push("/login")
      return
    }

    if (!profileUser) {
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

  const resolvedActivity = activity ?? fallbackActivity
  const name = guestActive ? "Guest explorer" : profileUser?.name || profileUser?.email || "Wlingo user"
  const subtitle = guestActive
    ? "Guest mode"
    : getRoleLabel(profileUser?.role ?? null)
  const heatmapDays = useMemo(() => resolvedActivity.days, [resolvedActivity.days])
  const heatmapCellSize = 12
  const heatmapGap = 4
  const heatmapWeekCount = Math.max(
    1,
    ...resolvedActivity.months.map((month) => month.weekIndex + 1),
    Math.ceil(heatmapDays.length / 7)
  )
  const heatmapWidth =
    heatmapWeekCount * heatmapCellSize + Math.max(heatmapWeekCount - 1, 0) * heatmapGap
  const visibleMonths = useMemo(() => {
    const minLabelSpacing = 28
    let lastLeft = -Infinity

    return resolvedActivity.months.filter((month) => {
      const left = month.weekIndex * (heatmapCellSize + heatmapGap)

      if (left - lastLeft < minLabelSpacing) {
        return false
      }

      lastLeft = left
      return true
    })
  }, [resolvedActivity.months, heatmapCellSize, heatmapGap])

  async function handleReviewLivesChange(nextLives: number) {
    if (guestActive || !profileUser || savingLives || nextLives === reviewLives) {
      return
    }

    setSavingLives(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reviewLives: nextLives
        })
      })

      if (!response.ok) {
        throw new Error("Could not update review lives.")
      }

      const payload = (await response.json()) as {
        user: AppUserRecord
      }

      setProfileUser(payload.user)
      setReviewLives(payload.user.reviewLives)
      showToast("Review lives updated.", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not update review lives.",
        "error"
      )
    } finally {
      setSavingLives(false)
    }
  }

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
            <span className="text-[15px] text-text-tertiary">{profileUser?.email || "Guest session"}</span>
          </div>
          <div className="flex min-h-[52px] items-center justify-between py-1">
            <span className="text-[17px] font-semibold text-text-primary">Role</span>
            <span className="text-[15px] text-text-tertiary">{subtitle}</span>
          </div>
          {profileUser?.role === "ADMIN" ? (
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
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-label">Review lives</p>
            <h2 className="mt-2 text-[22px] font-bold tracking-[-0.5px] text-text-primary">
              {guestActive ? DEFAULT_GUEST_REVIEW_LIVES : reviewLives} tries per stage
            </h2>
            <p className="mt-1 text-[15px] text-text-secondary">
              {guestActive
                ? "Guest mode always uses 3 lives for linked review sessions."
                : "Choose how many mistakes each review stage allows before it resets."}
            </p>
          </div>
          <div className="flex items-center gap-1 text-dangerText">
            {Array.from({
              length: guestActive ? DEFAULT_GUEST_REVIEW_LIVES : reviewLives
            }).map((_, index) => (
              <Heart key={`profile-heart-${index}`} size={16} fill="currentColor" />
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              disabled={guestActive || savingLives}
              onClick={() => void handleReviewLivesChange(value)}
              className={`min-w-[56px] rounded-[1rem] border px-4 py-3 text-sm font-semibold transition ${
                (guestActive ? DEFAULT_GUEST_REVIEW_LIVES : reviewLives) === value
                  ? "border-accent bg-accent text-accentForeground"
                  : "border-separator bg-bg-primary text-text-primary hover:border-accent"
              } ${guestActive || savingLives ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {value}
            </button>
          ))}
        </div>
      </section>

      <section className="panel p-4 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label">Activity</p>
            <h2 className="mt-2 text-[22px] font-bold tracking-[-0.5px] text-text-primary">
              {resolvedActivity.activeDaysLastYear} active days this year
            </h2>
            <p className="mt-1 text-[15px] text-text-secondary">
              {guestActive
                ? "Guest mode does not keep a year-to-date activity history yet."
                : `${resolvedActivity.totalReviewsLastYear} review attempts recorded since January 1.`}
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

        {activityLoading ? (
          <div className="mt-5 skeleton h-[240px] rounded-[1.5rem]" />
        ) : null}

        <div
          className={`mt-5 overflow-x-auto pb-1 hide-scrollbar native-scroll transition-opacity ${
            activityLoading ? "hidden" : activityRefreshing ? "opacity-70" : "opacity-100"
          }`}
        >
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
        {guestActive ? "Exit guest mode" : profileUser ? "Sign out" : "Open login"}
      </button>
    </div>
  )
}

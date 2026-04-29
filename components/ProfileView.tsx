"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ChevronDown, LogOut, Shield, User as UserIcon } from "lucide-react"

import { CEFR_LEVELS } from "@/lib/catalog"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { DEFAULT_GUEST_REVIEW_LIVES, clearGuestSession, isGuestSessionActive } from "@/lib/guest"
import { getRoleLabel } from "@/lib/roles"
import { buildEmptyProfileActivity } from "@/lib/profile-data"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import type { AppUserRecord, CefrLevel, ProfileActivityPayload } from "@/lib/types"

interface ProfileViewProps {
  user: AppUserRecord | null
  initialActivity?: ProfileActivityPayload | null
}

export function ProfileView({ user, initialActivity = null }: ProfileViewProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [guestActive, setGuestActive] = useState(false)
  const [profileUser, setProfileUser] = useState(user)
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>(user?.cefrLevel ?? "A1")
  const [savingLevel, setSavingLevel] = useState(false)
  const fallbackActivity = useMemo(() => buildEmptyProfileActivity(), [])
  const {
    data: activity,
    loading: activityLoading,
    refreshing: activityRefreshing
  } = useClientResource<ProfileActivityPayload>({
    key: guestActive || !profileUser ? "profile-activity:guest" : `profile-activity:${profileUser.id}`,
    enabled: !guestActive && Boolean(profileUser),
    initialData: guestActive || !profileUser ? fallbackActivity : initialActivity,
    revalidateOnMount: initialActivity === null,
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
    setCefrLevel(user?.cefrLevel ?? "A1")
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

  const resolvedActivity = activity ?? initialActivity ?? fallbackActivity
  const hasActivityData = Boolean(activity || initialActivity || guestActive || !profileUser)
  const name = guestActive ? "Guest explorer" : profileUser?.name || profileUser?.email || "LexiFlow user"
  const subtitle = guestActive
    ? "Guest mode"
    : getRoleLabel(profileUser?.role ?? null)
  const heatmapDays = useMemo(() => resolvedActivity.days, [resolvedActivity.days])
  const heatmapCellSize = 10
  const heatmapGap = 3
  const heatmapWeekCount = Math.max(
    1,
    ...resolvedActivity.months.map((month) => month.weekIndex + 1),
    Math.ceil(heatmapDays.length / 7)
  )
  const heatmapWidth =
    heatmapWeekCount * heatmapCellSize + Math.max(heatmapWeekCount - 1, 0) * heatmapGap
  const visibleMonths = useMemo(() => {
    const minLabelSpacing = 24
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

  async function handleCefrLevelChange(nextLevel: CefrLevel) {
    if (guestActive || !profileUser || savingLevel || nextLevel === cefrLevel) {
      return
    }

    setSavingLevel(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cefrLevel: nextLevel
        })
      })

      if (!response.ok) {
        throw new Error("Could not update CEFR level.")
      }

      const payload = (await response.json()) as {
        user: AppUserRecord
      }

      setProfileUser(payload.user)
      setCefrLevel(payload.user.cefrLevel)
      showToast("CEFR level updated.", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not update CEFR level.",
        "error"
      )
    } finally {
      setSavingLevel(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="panel overflow-hidden border-none bg-gradient-to-br from-[#2b2b31] to-[#1b1b20] p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] backdrop-blur-md">
              <UserIcon size={24} className="text-white/40" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-[20px] font-black tracking-tight text-white">
              {name}
            </h1>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="text-[12px] font-semibold text-white/50">{subtitle}</span>
              {profileUser?.createdAt && (
                <span className="text-[12px] font-medium text-white/20">
                  Joined {new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[16px] bg-white/[0.04] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Streak</p>
            <p className="text-[18px] font-black text-white">
              {guestActive ? 0 : profileUser?.streak ?? 0}
              <span className="ml-1 text-[11px] font-medium text-text-tertiary">d</span>
            </p>
          </div>
          <div className="rounded-[16px] bg-white/[0.04] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Active</p>
            {activityLoading && !hasActivityData ? (
              <div className="mt-1 skeleton skeleton-soft h-6 w-12" />
            ) : (
              <p className="text-[18px] font-black text-white">
                {resolvedActivity.activeDaysLastYear}
                <span className="ml-1 text-[11px] font-medium text-text-tertiary">d</span>
              </p>
            )}
          </div>
          <div className="rounded-[16px] bg-white/[0.04] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Status</p>
            <p className="truncate text-[15px] font-black text-white">
              {guestActive ? "Guest" : "Pro"}
            </p>
          </div>
        </div>
      </section>

      <section className="panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Activity</p>
            {activityLoading && !hasActivityData ? (
              <div className="mt-2 skeleton skeleton-soft h-6 w-20" />
            ) : (
              <h2 className="mt-1 text-[17px] font-bold text-white">
                {resolvedActivity.activeDaysLastYear} days
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level} className="h-2 w-2 rounded-[1px]" style={{ backgroundColor: `var(--activity-level-${level})` }} aria-hidden="true" />
              ))}
            </div>
          </div>
        </div>

        {activityLoading ? (
          <div className="mt-4 skeleton h-[100px] rounded-[16px]" />
        ) : (
          <div className={`mt-4 overflow-x-auto pb-1 hide-scrollbar native-scroll ${activityRefreshing ? "opacity-70" : ""}`}>
            <div className="min-w-fit">
              <div className="relative ml-6 h-4 text-[9px] font-bold uppercase tracking-widest text-text-tertiary" style={{ width: `${heatmapWidth}px` }}>
                {visibleMonths.map((month) => (
                  <span key={`${month.label}-${month.weekIndex}`} className="absolute top-0" style={{ left: `${month.weekIndex * (heatmapCellSize + heatmapGap)}px` }}>{month.label}</span>
                ))}
              </div>
              <div className="mt-1 flex gap-2">
                <div className="grid grid-rows-7 gap-[3px] text-[8px] font-bold text-text-tertiary">
                  {["", "M", "", "W", "", "F", ""].map((label, index) => (
                    <span key={`${label}-${index}`} className="flex h-[10px] items-center">{label}</span>
                  ))}
                </div>
                <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ width: `${heatmapWidth}px` }}>
                  {heatmapDays.map((day) => (
                    <div key={day.date} className="h-[10px] w-[10px] rounded-[1px]" style={{ backgroundColor: `var(--activity-level-${day.level})` }} title={`${day.count} reviews on ${day.date}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="panel overflow-hidden p-2">
        <div className="space-y-0.5">
          <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Target level</p>
                <p className="mt-1 text-[12px] leading-relaxed text-text-tertiary">
                  Determines the difficulty of recommended catalog words.
                </p>
              </div>
              {savingLevel ? (
                <span className="text-[11px] font-bold text-white/45">Saving...</span>
              ) : null}
            </div>

            <div className="relative mt-3">
              <select
                value={guestActive ? "A1" : cefrLevel}
                disabled={guestActive || savingLevel}
                onChange={(event) => void handleCefrLevelChange(event.target.value as CefrLevel)}
                className="h-11 w-full appearance-none rounded-[14px] border border-white/[0.08] bg-white/[0.04] px-4 pr-10 text-[14px] font-bold text-white outline-none transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {CEFR_LEVELS.map((value) => (
                  <option key={value} value={value} className="bg-[#16161b] text-white">
                    {value}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/36"
              />
            </div>
          </div>

          <div className="flex min-h-[40px] items-center justify-between rounded-[12px] px-3 transition hover:bg-white/[0.04]">
            <span className="text-[13px] font-semibold text-text-primary">Email</span>
            <span className="text-[12px] text-text-tertiary">{profileUser?.email || "Guest"}</span>
          </div>
          {profileUser?.role === "ADMIN" ? (
            <Link href="/admin" prefetch className="flex min-h-[40px] items-center justify-between rounded-[12px] px-3 transition hover:bg-white/[0.04]">
              <span className="inline-flex items-center gap-3 text-[13px] font-semibold text-text-primary">
                <Shield size={14} className="text-emerald-400" />
                Admin Dashboard
              </span>
              <ArrowRight size={14} className="text-text-tertiary" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleExit}
            className="flex min-h-[40px] w-full items-center justify-between rounded-[12px] px-3 text-[13px] font-bold text-dangerText transition hover:bg-white/[0.04] active:scale-[0.98]"
          >
            <span className="inline-flex items-center gap-3">
              <LogOut size={14} />
              {guestActive ? "Exit guest mode" : "Sign out"}
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ChevronDown, Eye, EyeOff, KeyRound, LogOut, Moon, Shield, Sun, User as UserIcon } from "lucide-react"
import { useTheme } from "@/lib/theme-context"

import { CEFR_LEVELS } from "@/lib/catalog"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { DEFAULT_GUEST_REVIEW_LIVES, clearGuestSession, isGuestSessionActive } from "@/lib/guest"
import { getRoleLabel } from "@/lib/roles"
import { buildEmptyProfileActivity } from "@/lib/profile-data"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import type { AppUserRecord, CefrLevel, GrammarSkillsPayload, ProfileActivityPayload } from "@/lib/types"

interface ProfileViewProps {
  user: AppUserRecord | null
  initialActivity?: ProfileActivityPayload | null
}

const emptyGrammarSkills: GrammarSkillsPayload = {
  items: [],
  weakCount: 0,
  trend: []
}

function formatDetectedDate(value: string | null) {
  if (!value) {
    return null
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })
}

function getScoreBandLabel(score: number) {
  if (score <= -71) return "Critical"
  if (score <= -41) return "Serious"
  if (score <= -16) return "Weak"
  return "Minor"
}

export function ProfileView({ user, initialActivity = null }: ProfileViewProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [guestActive, setGuestActive] = useState(false)
  const [profileUser, setProfileUser] = useState(user)
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>(user?.cefrLevel ?? "A1")
  const [savingLevel, setSavingLevel] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
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
  const {
    data: grammarSkills,
    loading: grammarLoading,
    refreshing: grammarRefreshing
  } = useClientResource<GrammarSkillsPayload>({
    key: guestActive || !profileUser ? "profile-grammar:guest" : `profile-grammar:${profileUser.id}:weak`,
    enabled: !guestActive && Boolean(profileUser),
    initialData: guestActive || !profileUser ? emptyGrammarSkills : null,
    loader: async () => {
      const response = await fetch("/api/profile/grammar-skills?scope=weak", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load grammar skills.")
      }

      return (await response.json()) as GrammarSkillsPayload
    },
    onError: () => {
      showToast("Could not load grammar weak points.", "error")
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

    if (profileUser.email === "admin@localhost") {
      await fetch("/api/auth/dev-logout")
      router.push("/login")
      router.refresh()
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
  const resolvedGrammarSkills = grammarSkills ?? emptyGrammarSkills
  const hasActivityData = Boolean(activity || initialActivity || guestActive || !profileUser)
  const name = guestActive ? "Guest explorer" : profileUser?.name || profileUser?.email || "LexiFlow user"
  const subtitle = guestActive
    ? "Guest mode"
    : getRoleLabel(profileUser?.role ?? null)
  const canManageCefrLevel = profileUser?.role === "ADMIN"
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

  const { theme, toggleTheme } = useTheme()

  return (
    <div className="space-y-4">
      <section className="panel overflow-hidden border-none bg-gradient-to-br from-bg-secondary to-bg-primary p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft backdrop-blur-md">
              <UserIcon size={24} className="text-muted" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-[20px] font-black tracking-tight text-ink">
              {name}
            </h1>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="text-[12px] font-semibold text-muted">{subtitle}</span>
              {profileUser?.createdAt && (
                <span className="text-[12px] font-medium text-quiet">
                  Joined {new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[16px] bg-bg-tertiary p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-quiet">Streak</p>
            <p className="text-[18px] font-black text-ink">
              {guestActive ? 0 : profileUser?.streak ?? 0}
              <span className="ml-1 text-[11px] font-medium text-quiet">d</span>
            </p>
          </div>
          <div className="rounded-[16px] bg-bg-tertiary p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-quiet">Active</p>
            {activityLoading && !hasActivityData ? (
              <div className="mt-1 skeleton skeleton-soft h-6 w-12" />
            ) : (
              <p className="text-[18px] font-black text-ink">
                {resolvedActivity.activeDaysLastYear}
                <span className="ml-1 text-[11px] font-medium text-quiet">d</span>
              </p>
            )}
          </div>
          <div className="rounded-[16px] bg-bg-tertiary p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-quiet">Status</p>
            <p className="truncate text-[15px] font-black text-ink">
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
              <h2 className="mt-1 text-[17px] font-bold text-ink">
                {resolvedActivity.activeDaysLastYear} days
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
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
              <div className="relative ml-6 h-4 text-[9px] font-bold uppercase tracking-widest text-muted" style={{ width: `${heatmapWidth}px` }}>
                {visibleMonths.map((month) => (
                  <span key={`${month.label}-${month.weekIndex}`} className="absolute top-0" style={{ left: `${month.weekIndex * (heatmapCellSize + heatmapGap)}px` }}>{month.label}</span>
                ))}
              </div>
              <div className="mt-1 flex gap-2">
                <div className="grid grid-rows-7 gap-[3px] text-[8px] font-bold text-muted">
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

        <Link
          href="/stats"
          prefetch
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <span>View detailed stats</span>
          <ArrowRight size={14} className="text-quiet" />
        </Link>
      </section>

      <section className="panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Grammar Progress</p>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[18px] font-black text-ink">
                  {grammarLoading && !grammarSkills ? "..." : resolvedGrammarSkills.weakCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500/80">Weak</span>
              </div>
              <div className="h-8 w-[1px] bg-line" />
              <div className="flex flex-col">
                <span className="text-[18px] font-black text-ink">
                  {grammarLoading && !grammarSkills ? "..." : resolvedGrammarSkills.items.filter(i => i.score >= -30 && i.score < 30 && i.evidenceCount > 0).length}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Learning</span>
              </div>
            </div>
          </div>
          <Link
            href="/grammar"
            prefetch
            className="flex h-11 items-center gap-2 rounded-2xl bg-bg-tertiary px-4 text-[13px] font-bold text-ink transition hover:bg-bg-tertiary/80 active:scale-[0.98] border border-line"
          >
            <span>Open Grammar</span>
            <ArrowRight size={14} className="text-quiet" />
          </Link>
        </div>
      </section>

      <section className="panel overflow-hidden p-2">
        <div className="space-y-0.5">
          {canManageCefrLevel ? (
            <div className="rounded-[16px] border border-line bg-bg-secondary px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Target level</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-quiet">
                    Admin-only override for recommendation difficulty.
                  </p>
                </div>
                {savingLevel ? (
                  <span className="text-[11px] font-bold text-quiet">Saving...</span>
                ) : null}
              </div>

              <div className="relative mt-3">
                <select
                  value={guestActive ? "A1" : cefrLevel}
                  disabled={guestActive || savingLevel}
                  onChange={(event) => void handleCefrLevelChange(event.target.value as CefrLevel)}
                  className="h-11 w-full appearance-none rounded-[14px] border border-line bg-bg-secondary px-4 pr-10 text-[14px] font-bold text-ink outline-none transition hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {CEFR_LEVELS.map((value) => (
                    <option key={value} value={value} className="bg-bg-secondary text-ink">
                      {value}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-quiet"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-[16px] border border-line bg-bg-secondary px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Vocabulary level</p>
              <p className="mt-1 text-[12px] leading-relaxed text-quiet">
                This will be guided by onboarding and the upcoming level test instead of manual selection.
              </p>
            </div>
          )}

          <div className="flex min-h-[40px] items-center justify-between rounded-[12px] px-3 transition hover:bg-bg-tertiary">
            <span className="text-[13px] font-semibold text-ink">Email</span>
            <span className="text-[12px] text-muted">{profileUser?.email || "Guest"}</span>
          </div>

          {/* Password section — visible for real (non-guest) users */}
          {profileUser && !guestActive && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => { setShowPasswordSection((v) => !v); setPasswordError(null) }}
                className="flex min-h-[40px] w-full items-center justify-between rounded-[12px] px-3 transition hover:bg-bg-tertiary"
              >
                <span className="inline-flex items-center gap-3 text-[13px] font-semibold text-ink">
                  <KeyRound size={14} className="text-muted" />
                  {profileUser.hasPassword ? "Change password" : "Set password"}
                </span>
                <span className={`text-[11px] font-bold transition ${showPasswordSection ? "text-ink" : "text-muted"}`}>
                  {showPasswordSection ? "Cancel" : profileUser.hasPassword ? "Change" : "Add"}
                </span>
              </button>

              {showPasswordSection && (
                <form
                  className="mt-2 space-y-3 rounded-[14px] border border-line bg-bg-secondary p-4"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setPasswordError(null)
                    if (newPassword.length < 8) {
                      setPasswordError("Password must be at least 8 characters")
                      return
                    }
                    if (newPassword !== confirmNewPassword) {
                      setPasswordError("Passwords do not match")
                      return
                    }
                    setSavingPassword(true)
                    try {
                      const res = await fetch("/api/profile/password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: newPassword, currentPassword: currentPassword || undefined })
                      })
                      const data = await res.json()
                      if (!res.ok) {
                        setPasswordError(data.message || "Something went wrong")
                        return
                      }
                      showToast(data.message || "Password saved!", "success")
                      setShowPasswordSection(false)
                      setCurrentPassword("")
                      setNewPassword("")
                      setConfirmNewPassword("")
                      router.refresh()
                    } catch {
                      setPasswordError("Network error. Please try again.")
                    } finally {
                      setSavingPassword(false)
                    }
                  }}
                >
                  {!profileUser.hasPassword && (
                    <p className="text-[12px] text-quiet">
                      You signed in with Google. Add a password to also log in with email.
                    </p>
                  )}

                  {profileUser.hasPassword && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">Current password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-[12px] border border-line bg-bg-primary px-3 py-2.5 text-[14px] font-medium text-ink outline-none focus:border-accent/60"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">
                      {profileUser.hasPassword ? "New password" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null) }}
                        placeholder="At least 8 characters"
                        className="w-full rounded-[12px] border border-line bg-bg-primary px-3 py-2.5 pr-10 text-[14px] font-medium text-ink outline-none focus:border-accent/60"
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50 hover:text-muted">
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">Confirm password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordError(null) }}
                      placeholder="••••••••"
                      className="w-full rounded-[12px] border border-line bg-bg-primary px-3 py-2.5 text-[14px] font-medium text-ink outline-none focus:border-accent/60"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-[12px] font-medium text-rose-400">{passwordError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex h-10 w-full items-center justify-center rounded-[12px] bg-ink text-[13px] font-black text-bg-primary transition hover:opacity-90 disabled:opacity-45"
                  >
                    {savingPassword ? "Saving…" : profileUser.hasPassword ? "Change password" : "Set password"}
                  </button>
                </form>
              )}
            </div>
          )}

          {profileUser && (profileUser.role === "ADMIN" || profileUser.email === "admin@localhost") && (
            <div className="mt-4 rounded-[16px] border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500/60">Developer Settings</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-ink">Toggle Dev Role</p>
                  <p className="text-[11px] text-quiet">Switch between Admin and User view</p>
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/dev/toggle-role", { method: "POST" })
                    if (res.ok) {
                      showToast("Role toggled. Refreshing...", "success")
                      router.refresh()
                    }
                  }}
                  className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
                >
                  Switch to {profileUser.role === "ADMIN" ? "User" : "Admin"}
                </button>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          <div className="mt-4 rounded-[16px] border border-line bg-bg-secondary p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-quiet">Appearance</p>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-ink">Theme</p>
                <p className="text-[11px] text-quiet">{theme === 'dark' ? 'Dark' : 'Light'} mode active</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex h-10 w-20 items-center rounded-full bg-bg-secondary p-1 transition-all border border-line shadow-inner"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform duration-300 ${theme === 'dark' ? 'translate-x-10 bg-indigo-950' : 'translate-x-0 bg-white'}`}>
                  {theme === 'dark' ? <Moon size={14} className="text-indigo-200" /> : <Sun size={14} className="text-amber-500" />}
                </div>
              </button>
            </div>
          </div>

          {profileUser?.role === "ADMIN" ? (
            <Link href="/admin" prefetch className="flex min-h-[40px] items-center justify-between rounded-[12px] px-3 transition hover:bg-bg-tertiary">
              <span className="inline-flex items-center gap-3 text-[13px] font-semibold text-ink">
                <Shield size={14} className="text-emerald-400" />
                Admin Dashboard
              </span>
              <ArrowRight size={14} className="text-muted" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleExit}
            className="flex min-h-[40px] w-full items-center justify-between rounded-[12px] px-3 text-[13px] font-bold text-dangerText transition hover:bg-bg-tertiary active:scale-[0.98]"
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

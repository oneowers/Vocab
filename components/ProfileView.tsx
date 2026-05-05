"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, Sun, Moon, User as UserIcon, ShieldCheck, CreditCard, RefreshCcw, Cloud, MapPin, Music, Sparkles, X, ChevronLeft, Key } from "lucide-react"
import { AppleListItem, AppleHeader, AppleAlert } from "./AppleDashboardComponents"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/lib/theme-context"

import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { isGuestSessionActive, clearGuestSession } from "@/lib/guest"
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

export function ProfileView({ user, initialActivity = null }: ProfileViewProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [guestActive, setGuestActive] = useState(false)
  const [profileUser, setProfileUser] = useState(user)
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>(user?.cefrLevel ?? "A1")
  const [savingLevel, setSavingLevel] = useState(false)
  const [showLevelPicker, setShowLevelPicker] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [errorAlert, setErrorAlert] = useState<{ title: string, message: string } | null>(null)
  const fallbackActivity = useMemo(() => buildEmptyProfileActivity(), [])
  
  const {
    data: activity,
  } = useClientResource<ProfileActivityPayload>({
    key: guestActive || !profileUser ? "profile-activity:guest" : `profile-activity:${profileUser.id}`,
    enabled: !guestActive && Boolean(profileUser),
    initialData: guestActive || !profileUser ? fallbackActivity : initialActivity,
    revalidateOnMount: initialActivity === null,
    loader: async () => {
      const response = await fetch("/api/profile/activity", { cache: "no-store" })
      if (!response.ok) throw new Error("Could not load activity.")
      return (await response.json()) as ProfileActivityPayload
    },
    onError: () => showToast("Could not load profile activity.", "error")
  })

  const {
    data: grammarSkills,
  } = useClientResource<GrammarSkillsPayload>({
    key: guestActive || !profileUser ? "profile-grammar:guest" : `profile-grammar:${profileUser.id}:weak`,
    enabled: !guestActive && Boolean(profileUser),
    initialData: guestActive || !profileUser ? emptyGrammarSkills : null,
    loader: async () => {
      const response = await fetch("/api/profile/grammar-skills?scope=weak", { cache: "no-store" })
      if (!response.ok) throw new Error("Could not load grammar skills.")
      return (await response.json()) as GrammarSkillsPayload
    },
    onError: () => showToast("Could not load grammar weak points.", "error")
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
    if (supabase) {
      await supabase.auth.signOut()
    }
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const resolvedActivity = activity ?? initialActivity ?? fallbackActivity
  const name = guestActive ? "Guest explorer" : profileUser?.name || profileUser?.email || "LexiFlow user"
  
  async function handleCefrLevelChange(nextLevel: CefrLevel) {
    if (guestActive || !profileUser || savingLevel || nextLevel === cefrLevel) {
      return
    }
    setSavingLevel(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cefrLevel: nextLevel })
      })
      if (!response.ok) throw new Error("Could not update CEFR level.")
      const payload = await response.json()
      setProfileUser(payload.user)
      setCefrLevel(payload.user.cefrLevel)
      showToast("CEFR level updated.", "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not update level.", "error")
    } finally {
      setSavingLevel(false)
    }
  }

  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-black pb-20 overflow-x-hidden">
      <AppleHeader title="LexiFlow Account" />

      <div className="pt-28 px-4 space-y-8 max-w-xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-3.5">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full overflow-hidden shadow-2xl border-4 border-white/5 bg-[#1C1C1E] flex items-center justify-center transition-transform active:scale-95 cursor-pointer">
              {profileUser?.avatarUrl ? (
                <img 
                  src={profileUser.avatarUrl} 
                  alt={name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-b from-[#3A3A3C] to-[#1C1C1E] flex items-center justify-center">
                  <span className="text-4xl font-bold text-white/90 tracking-tighter">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {profileUser?.role === "PRO" && (
              <div className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-[#0A84FF] border-4 border-black flex items-center justify-center shadow-lg">
                <Shield size={16} className="text-white" fill="currentColor" />
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <h2 className="text-[30px] font-bold tracking-tight text-white leading-tight">{name}</h2>
            <p className="text-[15px] text-white/35 font-medium tracking-tight">
              {profileUser?.email || "guest@lexiflow.app"}
            </p>
          </div>
        </div>

        {/* Group 1: Core Account */}
        <div className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-white/[0.03]">
          <AppleListItem 
            title="Personal Information" 
            icon={<UserIcon size={18} />} 
            iconColor="bg-[#8E8E93]" 
            showDivider={true}
          />
          <AppleListItem 
            title="Sign-In & Security" 
            icon={<ShieldCheck size={18} />} 
            iconColor="bg-[#8E8E93]" 
            showDivider={true}
            onClick={() => setShowPasswordSection(true)}
            rightLabel={profileUser?.hasPassword ? "Secure" : "Set Up"}
          />
          <AppleListItem 
            title="Payment & Shipping" 
            icon={<CreditCard size={18} />} 
            iconColor="bg-[#8E8E93]" 
            showDivider={true}
            rightLabel="Visa"
          />
          <AppleListItem 
            title="Subscriptions" 
            icon={<RefreshCcw size={18} />} 
            iconColor="bg-[#8E8E93]" 
          />
        </div>

        {/* Group 2: Services */}
        <div className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-white/[0.03]">
          <AppleListItem 
            title="LexiCloud" 
            subtitle="Activity & Stats"
            icon={<Cloud size={18} />} 
            iconColor="bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6]" 
            showDivider={true}
            href="/stats"
            rightLabel={`${resolvedActivity.activeDaysLastYear}d`}
          />
          <AppleListItem 
            title="Grammar Path" 
            subtitle="Skill development"
            icon={<Sparkles size={18} />} 
            iconColor="bg-gradient-to-br from-[#BF5AF2] to-[#AF52DE]" 
            showDivider={true}
            onClick={() => setShowLevelPicker(true)}
            rightLabel={grammarSkills?.weakCount ? `${grammarSkills.weakCount} weak · ${cefrLevel}` : cefrLevel}
          />
          {profileUser?.role === "ADMIN" && (
            <AppleListItem 
              title="Admin Dashboard" 
              icon={<Shield size={18} />} 
              iconColor="bg-[#30D158]" 
              showDivider={true}
              href="/admin"
            />
          )}
          <AppleListItem 
            title="Find My Progress" 
            icon={<MapPin size={18} />} 
            iconColor="bg-[#30D158]" 
            showDivider={true}
          />
          <AppleListItem 
            title="Media & Purchases" 
            icon={<Music size={18} />} 
            iconColor="bg-[#007AFF]" 
            showDivider={true}
          />
          <AppleListItem 
            title="Appearance" 
            subtitle={theme === 'dark' ? 'Dark mode' : 'Light mode'}
            icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} 
            iconColor="bg-[#5E5CE6]" 
            onClick={toggleTheme}
          />
        </div>

        {/* Sign Out Action */}
        <div className="px-1 pt-4 pb-12">
          <button
            type="button"
            onClick={handleExit}
            className="w-full h-14 rounded-[20px] bg-[#1C1C1E] text-[#FF453A] font-semibold active:bg-white/5 transition-colors border border-white/[0.03] text-[17px]"
          >
            {guestActive ? "Exit guest mode" : "Sign Out"}
          </button>
          <p className="mt-8 text-center text-[12px] text-white/10 font-medium tracking-wide uppercase">
            LexiFlow Account · Version 1.2.0
          </p>
        </div>
      </div>

      {/* CEFR Level Picker Modal */}
      <AnimatePresence>
        {showLevelPicker && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLevelPicker(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-white/[0.05] p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-bold text-white">English Level</h2>
                <button onClick={() => setShowLevelPicker(false)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      void handleCefrLevelChange(level as CefrLevel)
                      setShowLevelPicker(false)
                    }}
                    className={`h-14 rounded-2xl font-bold transition-all ${
                      cefrLevel === level 
                        ? "bg-[#0A84FF] text-white" 
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Password Change Modal (iOS Style) */}
      <AnimatePresence>
        {showPasswordSection && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-14 pb-4">
              <button 
                onClick={() => setShowPasswordSection(false)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 text-white active:scale-90 transition-transform"
              >
                <ChevronLeft size={22} />
              </button>
              <button 
                onClick={() => setShowPasswordSection(false)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 text-white active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-8 pt-10 overflow-y-auto">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon */}
                <div className="h-20 w-20 rounded-full border-[3px] border-[#0A84FF] flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.3)]">
                  <Key size={36} className="text-[#0A84FF]" fill="currentColor" fillOpacity={0.1} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-[32px] font-bold text-white tracking-tight">New Password</h2>
                  <p className="text-[17px] text-white/40 leading-snug max-w-[280px] mx-auto">
                    Choose a secure password you can remember.
                  </p>
                </div>

                {/* Input Group */}
                <div className="w-full mt-10">
                  <div className="bg-[#1C1C1E] rounded-[22px] overflow-hidden border border-white/[0.05]">
                    {profileUser?.hasPassword && (
                      <>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current Password"
                          className="w-full h-14 bg-transparent px-5 text-white placeholder:text-white/20 outline-none text-[17px]"
                        />
                        <div className="h-[0.5px] bg-white/[0.08] ml-5" />
                      </>
                    )}
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      className="w-full h-14 bg-transparent px-5 text-white placeholder:text-white/20 outline-none text-[17px]"
                    />
                    <div className="h-[0.5px] bg-white/[0.08] ml-5" />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full h-14 bg-transparent px-5 text-white placeholder:text-white/20 outline-none text-[17px]"
                    />
                  </div>
                  
                  <p className="mt-4 px-4 text-[13px] text-white/25 leading-relaxed text-left">
                    Your password must be at least 8 characters, include a number, an uppercase letter, and a lowercase letter.
                  </p>
                </div>


              </div>
            </div>

            {/* Sticky Action Button */}
            <div className="p-8 pb-12">
              <button
                onClick={async (e) => {
                  if (newPassword.length < 8) { 
                    setErrorAlert({ title: "Weak Password", message: "Your new password must be at least 8 characters long." })
                    return 
                  }
                  if (newPassword !== confirmNewPassword) { 
                    setErrorAlert({ title: "Mismatch", message: "The new password and confirmation do not match." })
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
                      setErrorAlert({ title: "Update Failed", message: data.message || "We couldn't update your password. Please try again." })
                      return 
                    }
                    showToast("Password saved!", "success")
                    setShowPasswordSection(false)
                    setCurrentPassword("")
                    setNewPassword("")
                    setConfirmNewPassword("")
                  } catch { 
                    setErrorAlert({ title: "Connection Error", message: "Check your internet connection and try again." })
                  } finally { setSavingPassword(false) }
                }}
                disabled={savingPassword}
                className="w-full h-16 rounded-[20px] bg-[#0A84FF] text-white text-[18px] font-bold active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_8px_24px_rgba(10,132,255,0.3)]"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AppleAlert 
        isOpen={Boolean(errorAlert)}
        onClose={() => setErrorAlert(null)}
        title={errorAlert?.title || "Error"}
        message={errorAlert?.message || ""}
      />
    </div>
  )
}

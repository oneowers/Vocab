"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, LogOut, Shield } from "lucide-react"

import { useToast } from "@/components/Toast"
import { clearGuestSession, isGuestSessionActive } from "@/lib/guest"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import type { AppUserRecord } from "@/lib/types"

interface ProfileViewProps {
  user: AppUserRecord | null
}

export function ProfileView({ user }: ProfileViewProps) {
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

  const name = guestActive ? "Guest explorer" : user?.name || user?.email || "WordFlow user"
  const subtitle = guestActive
    ? "Guest mode"
    : user?.role === "ADMIN"
      ? "Administrator"
      : user
        ? "Learner"
        : "Not signed in"

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

      <button type="button" onClick={handleExit} className="button-secondary w-full">
        <LogOut size={18} />
        {guestActive ? "Exit guest mode" : user ? "Sign out" : "Open login"}
      </button>
    </div>
  )
}

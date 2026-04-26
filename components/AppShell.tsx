"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { GuestBanner } from "@/components/GuestBanner"
import { PageTransition } from "@/components/PageTransition"
import { useToast } from "@/components/Toast"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import type { AppUserRecord } from "@/lib/types"
import { clearGuestSession, isGuestSessionActive } from "@/lib/guest"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/review", label: "Review" },
  { href: "/stats", label: "Stats" }
]

interface AppShellProps {
  user: AppUserRecord | null
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()
  const [guestActive, setGuestActive] = useState(false)

  useEffect(() => {
    setGuestActive(isGuestSessionActive())
  }, [pathname])

  useEffect(() => {
    router.prefetch("/login")
  }, [router])

  async function handleExit() {
    if (guestActive) {
      clearGuestSession()
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

  const initials = (user?.name || user?.email || "G").slice(0, 1).toUpperCase()

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel sticky top-4 z-30 flex flex-col gap-4 rounded-[2rem] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" prefetch className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-ink text-lg font-semibold text-white">
                W
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-quiet">WordFlow</p>
                <p className="text-sm text-muted">Spaced repetition deck</p>
              </div>
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-ink text-white"
                    : "text-muted hover:bg-[#F4F5F7] hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === "ADMIN" ? (
              <Link
                href="/admin"
                prefetch
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  pathname.startsWith("/admin")
                    ? "bg-ink text-white"
                    : "text-muted hover:bg-[#F4F5F7] hover:text-ink"
                }`}
              >
                Admin
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-ink">
                {guestActive ? "Guest explorer" : user?.name || user?.email || "WordFlow user"}
              </p>
              <p className="text-xs text-quiet">
                {user?.role === "ADMIN" ? "ADMIN" : guestActive ? "Guest mode" : "Learner"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F5F7] text-sm font-semibold text-ink">
              {initials}
            </div>
            <button
              type="button"
              onClick={handleExit}
              className="button-secondary px-4 py-2 text-sm font-medium"
            >
              {guestActive ? "Exit guest" : "Sign out"}
            </button>
          </div>
        </header>

        <div className="mt-5">
          <GuestBanner />
        </div>

        <main className="mt-5 flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}

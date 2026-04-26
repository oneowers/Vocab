"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRight, LogOut } from "lucide-react"

import { BottomTabBar } from "@/components/BottomTabBar"
import { GuestBanner } from "@/components/GuestBanner"
import { PageTransition } from "@/components/PageTransition"
import { useToast } from "@/components/Toast"
import { appNavItems } from "@/lib/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import type { AppUserRecord } from "@/lib/types"
import { clearGuestSession, isGuestSessionActive } from "@/lib/guest"

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
  const accountLabel = guestActive ? "Guest explorer" : user?.name || user?.email || "WordFlow user"
  const accountRole = user?.role === "ADMIN" ? "Administrator" : guestActive ? "Guest mode" : "Learner"

  return (
    <div className="min-h-screen bg-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden min-h-screen w-[288px] flex-col justify-between border-r border-line bg-background-primary/80 px-6 py-8 backdrop-blur-xl md:flex">
          <div className="space-y-8">
            <Link href="/dashboard" prefetch className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent text-lg font-semibold text-white">
                W
              </div>
              <div>
                <p className="section-label">WordFlow</p>
                <p className="mt-1 text-[15px] text-muted">Apple-inspired vocabulary studio</p>
              </div>
            </Link>

            <nav className="space-y-2">
              {appNavItems.map((item) => {
                const active = item.match ? item.match(pathname) : pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[52px] items-center gap-3 rounded-card px-4 text-[17px] font-semibold transition ${
                      active
                        ? "bg-background-primary text-accent shadow-subtle"
                        : "text-muted hover:bg-background-primary hover:text-ink"
                    }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {user?.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  prefetch
                  aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                  className={`flex min-h-[52px] items-center gap-3 rounded-card px-4 text-[17px] font-semibold transition ${
                    pathname.startsWith("/admin")
                      ? "bg-background-primary text-accent shadow-subtle"
                      : "text-muted hover:bg-background-primary hover:text-ink"
                  }`}
                >
                  <ArrowRight size={20} strokeWidth={pathname.startsWith("/admin") ? 2.4 : 2} />
                  <span>Admin</span>
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="panel space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background-secondary text-sm font-semibold text-ink">
                {initials}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-ink">{accountLabel}</p>
                <p className="text-[13px] text-quiet">{accountRole}</p>
              </div>
            </div>
            <button type="button" onClick={handleExit} className="button-secondary w-full">
              <LogOut size={18} />
              {guestActive ? "Exit guest" : "Sign out"}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="page-with-tabbar flex-1 px-4 py-4 md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-6">
              <section className="panel p-4 md:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-accent text-lg font-semibold text-white">
                      W
                    </div>
                    <div>
                      <p className="section-label">WordFlow</p>
                      <p className="mt-1 text-[15px] font-semibold text-ink">{accountLabel}</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleExit} className="button-secondary px-4 text-[15px]">
                    {guestActive ? "Exit" : "Sign out"}
                  </button>
                </div>
                <p className="mt-3 text-[13px] text-quiet">{accountRole}</p>
              </section>

              <GuestBanner />

              <main className="min-w-0 flex-1">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>

          <BottomTabBar items={appNavItems} variant="app" />
        </div>
      </div>
    </div>
  )
}

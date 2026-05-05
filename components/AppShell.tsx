"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRight, LogOut, ChevronRight } from "lucide-react"


import { BottomTabBar } from "@/components/BottomTabBar"
import { BrandLogo } from "@/components/BrandLogo"
import { MobileHeader } from "@/components/MobileHeader"
import { PageTransition } from "@/components/PageTransition"
import { useToast } from "@/components/Toast"
import { prefetchClientResource } from "@/hooks/useClientResource"
import { getAppMobileNavItems, getAppSidebarNavItems } from "@/lib/navigation"
import { getRoleLabel } from "@/lib/roles"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import type { AppUserRecord, AppSettingsRecord } from "@/lib/types"
import { clearGuestSession, isGuestSessionActive } from "@/lib/guest"

interface AppShellProps {
  user: AppUserRecord | null
  settings?: AppSettingsRecord | null
  children: React.ReactNode
}

export function AppShell({ user, settings, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()
  const [guestActive, setGuestActive] = useState(false)
  const [mounted, setMounted] = useState(false)


  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setGuestActive(isGuestSessionActive())
  }, [pathname])

  useEffect(() => {
    const appRoutes = ["/", "/dashboard", "/translate", "/cards", "/practice", "/grammar", "/stats", "/review", "/profile", "/login"]
    appRoutes.forEach((href) => router.prefetch(href))
    if (user?.role === "ADMIN") {
      ;["/admin", "/admin/users"].forEach((href) => router.prefetch(href))
    }
  }, [router, user])

  useEffect(() => {
    if (!mounted || guestActive || !user) {
      return
    }

    const fetchJson = async <T,>(url: string) => {
      const response = await fetch(url, {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error(`Prefetch failed for ${url}`)
      }

      return (await response.json()) as T
    }

    const warmup = () => {
      const jobs = [
        prefetchClientResource("review:summary", () => fetchJson("/api/review/summary"), {
          staleTimeMs: 60_000
        }),
        prefetchClientResource("grammar:summary", () => fetchJson("/api/grammar/summary"), {
          staleTimeMs: 60_000
        }),
        prefetchClientResource("stats:summary:7", () => fetchJson("/api/stats/summary?days=7"), {
          staleTimeMs: 60_000
        })
      ]

      if (pathname === "/" || pathname === "/dashboard" || pathname === "/translate") {
        jobs.push(
          prefetchClientResource("practice:entry", () => fetchJson("/api/practice/entry"), {
            staleTimeMs: 60_000
          })
        )
      }

      void Promise.allSettled(jobs)
    }

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warmup, { timeout: 2_000 })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = globalThis.setTimeout(warmup, 400)
    return () => globalThis.clearTimeout(timeoutId)
  }, [guestActive, mounted, pathname, user])

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
    if (user.email === "admin@localhost") {
      await fetch("/api/auth/dev-logout")
      router.push("/login")
      router.refresh()
      return
    }
    const supabase = createSupabaseBrowserClient()
    if (supabase) {
      await supabase.auth.signOut()
    }

    // Always call our logout API to clear server-side cookies (email-session)
    await fetch("/api/auth/logout", { method: "POST" })

    router.push("/login")
    router.refresh()
  }

  const initials = (user?.name || user?.email || "G").slice(0, 1).toUpperCase()
  const accountRole = guestActive ? "Guest mode" : getRoleLabel(user?.role ?? null)
  const navRole = guestActive ? null : user?.role ?? null
  const sidebarNavItems = getAppSidebarNavItems(navRole, settings)
  const mobileNavItems = getAppMobileNavItems(navRole, settings)

  const isActive = (path: string, item: any) => {
    return item.match ? item.match(path) : path === item.href
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        {/* Desktop Sidebar */}
        <aside className="relative z-20 hidden min-h-screen w-[280px] flex-col justify-between border-r border-white/[0.08] bg-[#000000] px-6 py-10 md:flex">
          <div className="space-y-12">
            <Link href="/" prefetch className="flex items-center gap-4 group">
              <div className="h-11 w-11 flex items-center justify-center bg-white text-black rounded-[11px] p-2 shadow-xl transition-transform group-active:scale-90">
                <BrandLogo />
              </div>
              <span className="text-[17px] font-black uppercase tracking-widest text-white">LexiFlow</span>
            </Link>

            <nav className="flex flex-col gap-2">
              {sidebarNavItems.map((item) => {
                const active = isActive(pathname, item)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    className={`flex items-center gap-3.5 rounded-[12px] px-4 py-3 text-[15px] font-semibold transition-all apple-spring ${active
                      ? "bg-[#0A84FF] text-white shadow-[0_8px_20px_rgba(10,132,255,0.2)]"
                      : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                      }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-[16px] font-bold transition-all ${pathname.startsWith("/admin")
                    ? "bg-white/[0.05] text-white shadow-sm border border-white/[0.05]"
                    : "text-white/20 hover:text-white/40 hover:bg-white/[0.02]"
                    }`}
                >
                  <ArrowRight size={20} />
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="space-y-6">
            <Link
              href="/profile"
              className="group flex items-center gap-3.5 rounded-[18px] bg-white/[0.04] p-4 border border-white/[0.08] transition-all hover:bg-white/[0.06] apple-spring"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white shadow-sm">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full rounded-[12px] object-cover" />
                ) : (
                  <span className="text-[15px] font-bold text-black">{initials}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-white truncate max-w-[120px]">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.05em]">{accountRole}</span>
              </div>
            </Link>

            <button
              onClick={handleExit}
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-[16px] font-bold text-rose-500/80 transition-all hover:bg-rose-500/5"
            >
              <LogOut size={20} />
              <span>Sign out</span>
            </button>
          </div>
        </aside>


        <div className="relative z-0 flex min-h-screen min-w-0 flex-1 flex-col">
          {/* Mobile Header */}
          {mounted && <MobileHeader user={user} />}

          <div className={`flex-1 ${pathname === "/translate" || pathname === "/dashboard" ? "pt-0" : "pt-6"} md:pt-0 pb-32`}>
            <div className="mx-auto flex w-full max-w-6xl flex-col">
              <main className="min-w-0 flex-1">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>

          {mounted && <BottomTabBar items={mobileNavItems} variant="app" />}
        </div>
      </div>
    </div>
  )
}

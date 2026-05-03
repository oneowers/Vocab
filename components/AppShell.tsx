"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRight, LogOut } from "lucide-react"

import { BottomTabBar } from "@/components/BottomTabBar"
import { BrandLogo } from "@/components/BrandLogo"
import { PageTransition } from "@/components/PageTransition"
import { useToast } from "@/components/Toast"
import { getAppMobileNavItems, getAppSidebarNavItems } from "@/lib/navigation"
import { getRoleLabel } from "@/lib/roles"
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
    // Prefetch only the lightest, most likely next hops.
    const appRoutes = ["/", "/dashboard", "/profile", "/login"]

    appRoutes.forEach((href) => {
      router.prefetch(href)
    })

    if (user?.role === "ADMIN") {
      ;["/admin", "/admin/users"].forEach((href) => {
        router.prefetch(href)
      })
    }
  }, [router])

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

    // NEW: Dev admin logout bypass
    if (user.email === "admin@localhost") {
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

  const initials = (user?.name || user?.email || "G").slice(0, 1).toUpperCase()
  const accountLabel = guestActive
    ? "Guest explorer"
    : user?.name || user?.email || "LexiFlow user"
  const accountRole = guestActive ? "Guest mode" : getRoleLabel(user?.role ?? null)
  const navRole = guestActive ? null : user?.role ?? null
  const sidebarNavItems = getAppSidebarNavItems(navRole)
  const mobileNavItems = getAppMobileNavItems(navRole)

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="relative z-20 hidden min-h-screen w-[288px] flex-col justify-between border-r border-line bg-bg-secondary/80 px-6 py-8 backdrop-blur-xl md:flex">
          <div className="space-y-8">
            <Link href="/" prefetch className="flex items-center gap-3">
              <div className="brand-mark h-12 w-12 text-lg font-semibold">
                <BrandLogo />
              </div>
              <div>
                <p className="section-label">LexiFlow</p>
                <p className="mt-1 text-[15px] text-muted">Vocabulary practice studio</p>
              </div>
            </Link>

            <nav className="space-y-2">
              {sidebarNavItems.map((item) => {
                const active = item.match ? item.match(pathname) : pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[52px] items-center gap-3 rounded-[22px] px-4 text-[16px] font-semibold transition ${active
                      ? "bg-ink text-bg-primary"
                      : "text-muted hover:bg-bg-tertiary hover:text-ink"
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
                  className={`flex min-h-[52px] items-center gap-3 rounded-[22px] px-4 text-[16px] font-semibold transition ${pathname.startsWith("/admin")
                    ? "bg-ink text-bg-primary"
                    : "text-muted hover:bg-bg-tertiary hover:text-ink"
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
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-tertiary text-sm font-semibold text-ink">
                {initials}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-ink">{accountLabel}</p>
                <p className="text-[13px] text-quiet">{accountRole}</p>
              </div>
            </div>
            <button type="button" onClick={handleExit} className="button-secondary w-full bg-ink text-bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all">
              <LogOut size={18} />
              {guestActive ? "Exit guest" : user ? "Sign out" : "Open login"}
            </button>
          </div>
        </aside>

        <div className="relative z-0 flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="flex-1">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-6">
              <main className="min-w-0 flex-1">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>

          <BottomTabBar items={mobileNavItems} variant="app" />
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRight, LogOut, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { BottomTabBar } from "@/components/BottomTabBar"
import { BrandLogo } from "@/components/BrandLogo"
import { PageTransition } from "@/components/PageTransition"
import { useToast } from "@/components/Toast"
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setGuestActive(isGuestSessionActive())
  }, [pathname])

  useEffect(() => {
    const appRoutes = ["/", "/dashboard", "/profile", "/login"]
    appRoutes.forEach((href) => router.prefetch(href))
    if (user?.role === "ADMIN") {
      ;["/admin", "/admin/users"].forEach((href) => router.prefetch(href))
    }
  }, [router, user])

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
    <div className="min-h-screen bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        {/* Desktop Sidebar */}
        <aside className="relative z-20 hidden min-h-screen w-[300px] flex-col justify-between border-r border-white/[0.05] bg-[#050505] px-8 py-12 md:flex">
          <div className="space-y-12">
            <Link href="/" prefetch className="flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center bg-white text-black rounded-xl">
                <BrandLogo />
              </div>
              <span className="text-[16px] font-black uppercase tracking-widest text-white">LexiFlow</span>
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
                    className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-[16px] font-bold transition-all ${
                      active
                        ? "bg-white/[0.05] text-white shadow-sm border border-white/[0.05]"
                        : "text-white/20 hover:text-white/40 hover:bg-white/[0.02]"
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
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-[16px] font-bold transition-all ${
                    pathname.startsWith("/admin")
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
              className="group flex items-center gap-4 rounded-[32px] bg-white/[0.02] p-5 border border-white/[0.05] transition-all hover:bg-white/[0.04]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <span className="text-[16px] font-black text-black">{initials}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-black text-white truncate max-w-[120px]">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <span className="text-[12px] font-bold text-white/20 uppercase tracking-wider">{accountRole}</span>
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

        {/* Mobile Sidebar/Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-[70] flex w-[280px] flex-col justify-between bg-[#050505] p-8 shadow-2xl md:hidden"
              >
                <div className="space-y-10">
                  <div className="flex items-center justify-between">
                    <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3">
                      <div className="h-8 w-8 flex items-center justify-center bg-white text-black rounded-lg">
                        <BrandLogo />
                      </div>
                      <span className="text-[14px] font-black uppercase tracking-widest text-white">LexiFlow</span>
                    </Link>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="text-white/40 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <nav className="flex flex-col gap-1">
                    {sidebarNavItems.map((item) => {
                      const active = isActive(pathname, item)
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 text-[15px] font-bold transition-all ${
                            active
                              ? "bg-white/[0.05] text-white border border-white/[0.05]"
                              : "text-white/20 hover:text-white"
                          }`}
                        >
                          <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                <div className="space-y-4">
                  <Link 
                    href="/profile"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-4 rounded-3xl bg-white/[0.02] p-4 border border-white/[0.05]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                      <span className="text-[14px] font-black text-black">{initials}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-black text-white truncate max-w-[120px]">
                        {user?.name || user?.email?.split('@')[0]}
                      </span>
                      <span className="text-[11px] font-bold text-white/20 uppercase tracking-wider">{accountRole}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => { handleExit(); setIsSidebarOpen(false) }}
                    className="flex w-full items-center gap-4 px-4 py-3 text-[15px] font-bold text-rose-500/80"
                  >
                    <LogOut size={18} />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="relative z-0 flex min-h-screen min-w-0 flex-1 flex-col">
          {/* Mobile Header */}
          {mounted && (
            <div className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between px-6 md:hidden">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl text-white/60 active:scale-90 transition-all"
              >
                <Menu size={20} strokeWidth={2.5} />
              </button>

              <Link 
                href="/profile" 
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl shadow-2xl transition-transform active:scale-90"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <span className="text-[16px] font-black text-white">{initials}</span>
                )}
              </Link>
            </div>
          )}

          <div className="flex-1 pt-20 md:pt-0">
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

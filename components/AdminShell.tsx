"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { ArrowLeft, Shield } from "lucide-react"

import { AppleHeader } from "@/components/AppleDashboardComponents"
import { BrandLogo } from "@/components/BrandLogo"
import { BottomTabBar } from "@/components/BottomTabBar"
import { PageTransition } from "@/components/PageTransition"
import { adminMobileNavItems, adminNavItems, adminSidebarSections } from "@/lib/navigation"
import type { AppUserRecord } from "@/lib/types"

interface AdminShellProps {
  user: AppUserRecord
  children: React.ReactNode
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const currentNavItem = adminNavItems.find((item) => item.match?.(pathname) || pathname === item.href)
  const currentTitle = currentNavItem?.label ?? "Admin"
  const mobileBackTarget = pathname === "/admin" ? "/" : "/admin"

  useEffect(() => {
    ;["/admin", "/admin/catalog", "/admin/grammar-topics", "/admin/settings", "/admin/users", "/admin/cards", "/admin/analytics", "/", "/dashboard", "/profile"].forEach(
      (href) => {
        router.prefetch(href)
      }
    )
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden min-h-screen w-[304px] flex-col justify-between border-r border-white/[0.06] bg-[#080809] px-6 py-8 md:flex">
          <div className="space-y-8">
            <Link href="/admin" prefetch className="flex items-center gap-3 rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-black shadow-sm">
                <BrandLogo />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/32">LexiFlow</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-white">Administration</p>
                  <span className="rounded-full bg-[#0A84FF]/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7AB9FF]">
                    Admin
                  </span>
                </div>
              </div>
            </Link>

            <div className="space-y-4 rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-3">
              {adminSidebarSections.map((section) => (
                <div key={section.label} className="space-y-2">
                  <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/22">
                    {section.label}
                  </p>
                  <nav className="space-y-1.5">
                    {section.items.map((item) => {
                      const active = item.match ? item.match(pathname) : pathname === item.href
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-[50px] items-center gap-3 rounded-[18px] px-4 text-[14px] font-semibold transition ${active
                            ? "bg-[#0A84FF] text-white shadow-[0_12px_28px_rgba(10,132,255,0.24)]"
                            : "text-white/42 hover:bg-white/[0.04] hover:text-white/82"
                            }`}
                        >
                          <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/" prefetch className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] text-[14px] font-bold text-white/82">
              <ArrowLeft size={18} />
              Back to app
            </Link>
            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-sm font-semibold text-white">
                  {(user.name || user.email).slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white">{user.name || user.email}</p>
                  <p className="text-[13px] text-white/38">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="md:hidden">
            <AppleHeader
              title={currentTitle}
              onBack={() => router.push(mobileBackTarget)}
              rightElement={
                <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-white/[0.08] px-3 text-white/72">
                  <Shield size={15} />
                </div>
              }
            />
          </div>
          <div className="page-with-tabbar flex-1">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-20 md:px-0 md:pt-8 md:gap-6">
              <main className="min-w-0 flex-1">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>

          <BottomTabBar items={adminMobileNavItems} variant="admin" />
        </div>
      </div>
    </div>
  )
}

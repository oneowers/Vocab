 "use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { BottomTabBar } from "@/components/BottomTabBar"
import { PageTransition } from "@/components/PageTransition"
import { adminNavItems } from "@/lib/navigation"
import type { AppUserRecord } from "@/lib/types"

interface AdminShellProps {
  user: AppUserRecord
  children: React.ReactNode
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden min-h-screen w-[304px] flex-col justify-between border-r border-line bg-background-primary/80 px-6 py-8 backdrop-blur-xl md:flex">
          <div className="space-y-8">
            <Link href="/admin" prefetch className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent text-lg font-semibold text-white">
                W
              </div>
              <div>
                <p className="section-label">WordFlow</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-[15px] text-muted">Administration</p>
                  <span className="rounded-full bg-background-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                    Admin
                  </span>
                </div>
              </div>
            </Link>

            <nav className="space-y-2">
              {adminNavItems.map((item) => {
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
            </nav>
          </div>

          <div className="space-y-4">
            <Link href="/dashboard" prefetch className="button-secondary w-full">
              <ArrowLeft size={18} />
              Back to app
            </Link>
            <div className="panel p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background-secondary text-sm font-semibold text-ink">
                  {(user.name || user.email).slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{user.name || user.email}</p>
                  <p className="text-[13px] text-quiet">Administrator</p>
                </div>
              </div>
            </div>
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
                      <p className="section-label">Administration</p>
                      <p className="mt-1 text-[15px] font-semibold text-ink">{user.name || user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" prefetch className="button-secondary px-4 text-[15px]">
                    App
                  </Link>
                </div>
              </section>

              <main className="min-w-0 flex-1">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>

          <BottomTabBar items={adminNavItems} variant="admin" />
        </div>
      </div>
    </div>
  )
}

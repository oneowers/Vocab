import Link from "next/link"

import { PageTransition } from "@/components/PageTransition"
import type { AppUserRecord } from "@/lib/types"

interface AdminShellProps {
  user: AppUserRecord
  children: React.ReactNode
}

const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/cards", label: "Cards" },
  { href: "/admin/analytics", label: "Analytics" }
]

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel-admin flex flex-col gap-4 rounded-[2rem] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/admin" prefetch className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-ink text-lg font-semibold text-white">
                W
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-quiet">WordFlow</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted">Administration</p>
                  <span className="rounded-full bg-ink px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-white">
                    ADMIN
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-white hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              prefetch
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white"
            >
              Back to app
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-ink">{user.name || user.email}</p>
              <p className="text-xs text-quiet">Administrator</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-ink">
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mt-5 flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}

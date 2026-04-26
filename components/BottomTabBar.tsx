"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { NavItem } from "@/lib/types"

interface BottomTabBarProps {
  items: NavItem[]
  variant?: "app" | "admin"
}

function isActive(pathname: string, item: NavItem) {
  return item.match ? item.match(pathname) : pathname === item.href
}

export function BottomTabBar({
  items,
  variant = "app"
}: BottomTabBarProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label={variant === "admin" ? "Admin navigation" : "Primary navigation"}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-separator bg-[color:var(--bg-primary)]/85 backdrop-blur-[20px] md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      <div className="mx-auto flex h-[49px] max-w-xl items-stretch">
        {items.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 scale-100 flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-semibold leading-none transition-transform duration-300 ease-[var(--ease-standard)] active:scale-[0.88] motion-reduce:transition-none ${
                active ? "text-accent" : "text-quiet"
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.4 : 1.9} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

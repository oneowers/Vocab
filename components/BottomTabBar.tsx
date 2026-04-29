"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import type { NavItem } from "@/lib/types"

interface BottomTabBarProps {
  items: NavItem[]
  variant?: "app" | "admin"
}

function isActive(pathname: string, item: NavItem) {
  return item.match ? item.match(pathname) : pathname === item.href
}

function isKeyboardTarget(element: Element | null) {
  return Boolean(element?.matches("input, textarea, select, [contenteditable='true']"))
}

export function BottomTabBar({
  items,
  variant = "app"
}: BottomTabBarProps) {
  const pathname = usePathname()
  const [keyboardActive, setKeyboardActive] = useState(false)

  useEffect(() => {
    function syncKeyboardState() {
      setKeyboardActive(isKeyboardTarget(document.activeElement))
    }

    function handleFocusOut() {
      window.setTimeout(syncKeyboardState, 0)
    }

    document.addEventListener("focusin", syncKeyboardState)
    document.addEventListener("focusout", handleFocusOut)

    return () => {
      document.removeEventListener("focusin", syncKeyboardState)
      document.removeEventListener("focusout", handleFocusOut)
    }
  }, [])

  return (
    <nav
      aria-label={variant === "admin" ? "Admin navigation" : "Primary navigation"}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-black/82 backdrop-blur-[24px] transition-[transform,opacity] duration-200 ease-out md:hidden ${
        keyboardActive ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
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
              className={`flex min-w-0 flex-1 scale-100 flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-semibold leading-none transition-transform duration-300 ease-[var(--ease-standard)] active:scale-[0.88] motion-reduce:transition-none ${active ? "text-white" : "text-text-tertiary"
                }`}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.25 : 1.9}
                fill={active ? "currentColor" : "none"}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

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
      className={`fixed bottom-6 left-1/2 z-50 w-[min(90%,420px)] -translate-x-1/2 liquid-glass transition-all duration-500 ease-out md:hidden ${
        keyboardActive ? "pointer-events-none translate-y-32 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{ 
        borderRadius: "32px", 
        padding: "4px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)" 
      }}
    >
      <div className="relative flex h-[58px] items-stretch gap-1">
        {/* Sliding Pill Background */}
        <div className="absolute inset-0 z-0 flex px-0.5">
          {items.map((item) => {
            const active = isActive(pathname, item)
            return (
              <div key={item.href} className="flex-1 relative">
                {active && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-[28px] bg-white/[0.08]"
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 32,
                      mass: 1
                    }}
                    style={{
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1)"
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Nav Items */}
        {items.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={`relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-300 active:scale-95 ${
                active ? "text-[#0A84FF]" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                className={`transition-transform duration-300 ${active ? "scale-105" : "scale-100"}`}
              />
              <span className={`text-[10.5px] font-bold tracking-tight transition-colors ${active ? "text-[#0A84FF]" : "text-white/40"}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

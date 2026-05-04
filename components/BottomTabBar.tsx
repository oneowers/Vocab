"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

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
      className={`fixed bottom-8 left-1/2 z-50 w-[calc(100%-48px)] max-w-[400px] -translate-x-1/2 rounded-full border border-white/[0.08] bg-black/60 p-2 backdrop-blur-[32px] shadow-2xl transition-all duration-500 ease-out md:hidden ${
        keyboardActive ? "pointer-events-none translate-y-32 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative flex h-[64px] items-stretch gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full transition-all duration-300 active:scale-90 ${
                active ? "text-white" : "text-white/20 hover:text-white/40"
              }`}
            >
              <div className="relative z-10 flex flex-col items-center justify-center">
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  className="transition-all duration-300"
                />
                <AnimatePresence>
                  {active && (
                    <motion.span 
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-black uppercase tracking-widest mt-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              {active && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 z-0 rounded-full bg-white/[0.05] border border-white/[0.05]" 
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

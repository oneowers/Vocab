"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import type { AppUserRecord } from "@/lib/types"

interface SwitcherOption {
  label: string
  value: string
}

interface StickySwitcherHeaderProps {
  leftOption: SwitcherOption
  rightOption: SwitcherOption
  selectedValue: string
  onValueChange: (value: string) => void
  user: AppUserRecord | null
  sticky?: boolean
  onMenuClick?: () => void
}

export function StickySwitcherHeader({
  leftOption,
  rightOption,
  selectedValue,
  onValueChange,
  user,
  sticky = true,
  onMenuClick
}: StickySwitcherHeaderProps) {
  const isLeft = selectedValue === leftOption.value

  return (
    <div 
      className={`-mx-4 px-4 ${
        sticky 
          ? "sticky top-0 z-40 bg-black/60 pt-[env(safe-area-inset-top,20px)] pb-3 backdrop-blur-2xl md:static md:mx-0 md:bg-transparent md:pt-0 md:backdrop-blur-none" 
          : "relative mb-6 pt-1"
      }`}
    >
      <div className={`flex items-center justify-between px-3 ${sticky ? "mt-2" : "mt-0"}`}>
        {/* Profile on the Left */}
        <Link
          href="/profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white active:scale-95 transition-transform overflow-hidden border border-white/[0.1]"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[13px] font-black">
              {(user?.name || user?.email || "G").slice(0, 1).toUpperCase()}
            </span>
          )}
        </Link>

        {/* Switcher in the Middle */}
        <div className="relative flex rounded-full border border-white/[0.08] bg-white/[0.04] p-1 shadow-2xl backdrop-blur-xl mx-1">
          <div className="relative grid grid-cols-2 items-center">
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-1 top-1 z-0 w-[calc(50%-0.25rem)] rounded-full bg-[#0A84FF] shadow-[0_4px_12px_rgba(10,132,255,0.3)]"
              initial={false}
              animate={{
                x: isLeft ? "0%" : "100%"
              }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ left: "0.25rem" }}
            />
            <button
              type="button"
              onClick={() => onValueChange(leftOption.value)}
              className={`relative z-10 flex min-w-[85px] items-center justify-center rounded-full px-3 py-2 text-[13px] font-bold transition-all duration-300 md:min-w-[140px] md:text-[14px] ${
                isLeft ? "text-white" : "text-white/30 hover:text-white/60"
              }`}
            >
              {leftOption.label}
            </button>
            <button
              type="button"
              onClick={() => onValueChange(rightOption.value)}
              className={`relative z-10 flex min-w-[85px] items-center justify-center rounded-full px-3 py-2 text-[13px] font-bold transition-all duration-300 md:min-w-[140px] md:text-[14px] ${
                !isLeft ? "text-white" : "text-white/30 hover:text-white/60"
              }`}
            >
              {rightOption.label}
            </button>
          </div>
        </div>

        {/* Menu (Three dots) on the Right */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white active:scale-95 transition-transform border border-white/[0.1]"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  )
}


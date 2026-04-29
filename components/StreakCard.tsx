"use client"

import { Flame, Snowflake } from "lucide-react"
import { AppUserRecord } from "@/lib/types"
import { getTodayDateKey, getYesterdayDateKey } from "@/lib/date"
import { useEffect, useState } from "react"

interface StreakCardProps {
  user: AppUserRecord
  variant?: "default" | "compact"
}

export function StreakCard({ user, variant = "default" }: StreakCardProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const today = getTodayDateKey()
  const yesterday = getYesterdayDateKey(today)
  const isBroken = user.lastReviewDate !== today && user.lastReviewDate !== yesterday
  const hasReviewToday = user.lastReviewDate === today

  if (variant === "compact") {
    return (
      <div className="flex h-[54px] min-w-[70px] shrink-0 items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <Flame 
          size={18} 
          className={
            !mounted 
              ? "text-orange-500/50" 
              : hasReviewToday 
                ? "text-orange-500 animate-pulse" 
                : isBroken ? "text-slate-500" : "text-orange-500/50"
          } 
        />
        <span className="text-[15px] font-bold text-white">{user.streak}</span>
      </div>
    )
  }

  return (
    <article className="panel rounded-[24px] p-4 flex items-center justify-between group hover:bg-white/[0.04] transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 ${
          !mounted
            ? "bg-orange-500/10 text-orange-500/50"
            : hasReviewToday 
              ? "bg-orange-500/20 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]" 
              : isBroken
                ? "bg-slate-500/10 text-slate-500"
                : "bg-orange-500/10 text-orange-500/50"
        }`}>
          <Flame className={`w-6 h-6 ${mounted && hasReviewToday ? "animate-pulse" : ""}`} />
          {mounted && hasReviewToday && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-[#0a0c10]" />
          )}
        </div>
        
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-quiet">
            Daily Streak
          </p>
          <p className="text-xl font-bold text-ink">
            {user.streak} <span className="text-sm font-medium text-muted">days</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user.streakFreezes > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Snowflake className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{user.streakFreezes}</span>
          </div>
        )}
        
        {mounted && !hasReviewToday && isBroken && (
          <div className="text-right">
            <p className="text-[10px] font-medium text-orange-400">Streak in danger!</p>
          </div>
        )}
      </div>
    </article>
  )
}

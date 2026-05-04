"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function StatsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRange = searchParams.get("range") || "7d"

  const ranges = [
    { label: "7 days", value: "7d" },
    { label: "30 days", value: "30d" },
    { label: "90 days", value: "90d" },
    { label: "All time", value: "all" }
  ]

  function handleRangeChange(value: string) {
    const params = new URLSearchParams(searchParams)
    params.set("range", value)
    router.push(`/stats?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => handleRangeChange(range.value)}
          className={`h-8 shrink-0 rounded-xl px-4 text-[12px] font-black uppercase tracking-widest transition-all border ${
            currentRange === range.value
              ? "bg-white text-black border-white"
              : "bg-white/[0.03] text-white/40 border-white/5 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

"use client"

import { StickySwitcherHeader } from "./StickySwitcherHeader"

export function TranslateSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <StickySwitcherHeader
        leftOption={{ label: "...", value: "1" }}
        rightOption={{ label: "...", value: "2" }}
        selectedValue="1"
        onValueChange={() => {}}
        user={null} // Will show fallback avatar
        sticky={true}
      />

      <div className="mt-4 space-y-4">
        {/* Main Translator Cards Skeleton */}
        <div className="grid gap-3 lg:grid-cols-2">
          {/* Source Card */}
          <div className="liquid-glass rounded-[32px] min-h-[260px] p-7 border border-white/[0.05]">
            <div className="h-4 w-20 bg-white/10 rounded-full mb-8" />
            <div className="space-y-3">
              <div className="h-10 w-3/4 bg-white/5 rounded-2xl" />
              <div className="h-10 w-1/2 bg-white/5 rounded-2xl" />
            </div>
            <div className="mt-auto pt-10 flex justify-between">
              <div className="h-10 w-10 bg-white/10 rounded-full" />
              <div className="h-10 w-28 bg-white/10 rounded-full" />
            </div>
          </div>

          {/* Target Card */}
          <div className="liquid-glass rounded-[32px] min-h-[260px] p-7 border border-white/[0.05]">
            <div className="h-4 w-20 bg-white/10 rounded-full mb-8" />
            <div className="space-y-3">
              <div className="h-10 w-2/3 bg-white/5 rounded-2xl" />
            </div>
            <div className="mt-auto pt-10 flex justify-between">
              <div className="h-10 w-10 bg-white/10 rounded-full" />
              <div className="h-10 w-32 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

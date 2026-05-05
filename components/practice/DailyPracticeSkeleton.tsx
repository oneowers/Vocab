"use client"

import { Skeleton, SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"

export function DailyPracticeSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonCard className="rounded-[20px] p-4">
        <SkeletonLine className="h-4 w-28 rounded-full" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
        <div className="mt-4 flex items-center justify-between">
          <SkeletonLine className="h-4 w-16 rounded-full" />
          <SkeletonLine className="h-4 w-10 rounded-full" />
        </div>
      </SkeletonCard>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-3">
          <SkeletonLine className="h-3 w-24 rounded-full" />
          <SkeletonLine className="h-3 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 px-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} className="rounded-[20px] p-3.5">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <SkeletonLine className="mt-6 h-4 w-20 rounded-full" />
              <SkeletonLine className="mt-2 h-3 w-24 rounded-full" />
            </SkeletonCard>
          ))}
        </div>
      </section>

      <SkeletonCard className="rounded-[20px] overflow-hidden p-0">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-[8px]" />
                <div className="space-y-2">
                  <SkeletonLine className="h-4 w-24 rounded-full" />
                  <SkeletonLine className="h-3 w-28 rounded-full" />
                </div>
              </div>
              <SkeletonLine className="h-4 w-10 rounded-full" />
            </div>
            {index === 0 ? <div className="mt-3 h-px bg-white/[0.05]" /> : null}
          </div>
        ))}
      </SkeletonCard>
    </div>
  )
}

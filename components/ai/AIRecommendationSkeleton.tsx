"use client"

import { Skeleton, SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"

export function AIRecommendationSkeleton() {
  return (
    <div className="flex flex-col items-center py-4 text-center md:py-10">
      <Skeleton className="mb-4 h-14 w-14 rounded-[20px] md:h-20 md:w-20 md:rounded-3xl" />
      <SkeletonLine className="h-7 w-64 rounded-2xl md:h-10 md:w-96" />
      <SkeletonLine className="mt-3 h-4 w-72 rounded-full md:w-80" />

      <div className="mt-4 flex w-full items-center gap-1.5 overflow-hidden px-1 md:justify-center md:gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      <div className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 md:mt-10 md:gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} className="rounded-[22px] p-3.5 md:rounded-3xl md:p-5">
            <div className="flex items-center gap-3.5 md:flex-col md:items-start">
              <Skeleton className="h-10 w-10 rounded-xl md:h-11 md:w-11 md:rounded-2xl" />
              <div className="min-w-0 flex-1">
                <SkeletonLine className="h-4 w-24 rounded-full" />
                <SkeletonLine className="mt-2 h-3 w-32 rounded-full" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  )
}

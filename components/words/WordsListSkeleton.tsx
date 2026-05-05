"use client"

import { Skeleton, SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"

export function WordsListSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonCard className="rounded-[26px] p-3 md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SkeletonLine className="h-11 w-full max-w-sm rounded-[18px]" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonLine key={index} className="h-7 w-20 rounded-full" />
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonLine key={index} className="h-7 w-12 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </SkeletonCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} className="h-[148px] rounded-[26px] p-5">
            <div className="space-y-3">
              <SkeletonLine className="h-6 w-28 rounded-2xl" />
              <SkeletonLine className="h-4 w-24 rounded-full" />
              <div className="flex gap-2 pt-6">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  )
}

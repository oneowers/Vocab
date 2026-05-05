"use client"

import { Skeleton, SkeletonAvatar, SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"

export function ProfileCardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-3.5">
        <SkeletonAvatar className="h-28 w-28" />
        <div className="space-y-2">
          <SkeletonLine className="mx-auto h-8 w-40 rounded-2xl" />
          <SkeletonLine className="mx-auto h-4 w-52 rounded-full" />
        </div>
      </div>

      <SkeletonCard className="space-y-3 rounded-[24px]">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-[10px]" />
              <div className="space-y-2">
                <SkeletonLine className="h-4 w-32 rounded-full" />
                <SkeletonLine className="h-3 w-24 rounded-full" />
              </div>
            </div>
            <SkeletonLine className="h-4 w-14 rounded-full" />
          </div>
        ))}
      </SkeletonCard>
    </div>
  )
}

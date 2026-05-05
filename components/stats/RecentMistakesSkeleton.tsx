"use client"

import { SkeletonCard, SkeletonLine, SkeletonList } from "@/components/ui/Skeleton"

export function RecentMistakesSkeleton() {
  return (
    <SkeletonCard className="rounded-[2rem] p-5">
      <SkeletonLine className="h-3 w-28 rounded-full" />
      <div className="mt-4">
        <SkeletonList
          items={4}
          renderItem={() => (
            <div className="flex items-center justify-between gap-3 rounded-[1.5rem] bg-white/[0.03] px-4 py-4">
              <div className="min-w-0 space-y-2">
                <SkeletonLine className="h-4 w-24 rounded-full" />
                <SkeletonLine className="h-3 w-20 rounded-full" />
              </div>
              <SkeletonLine className="h-6 w-16 rounded-full" />
            </div>
          )}
        />
      </div>
    </SkeletonCard>
  )
}

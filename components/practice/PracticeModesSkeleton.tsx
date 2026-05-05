"use client"

import { Skeleton, SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"

export function PracticeModesSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0c10] px-4 pb-16 pt-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <SkeletonLine className="h-8 w-40 rounded-2xl" />
        <SkeletonLine className="h-4 w-64 rounded-full" />

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} className="rounded-[28px] p-5">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <SkeletonLine className="mt-5 h-5 w-28 rounded-full" />
              <SkeletonLine className="mt-2 h-4 w-40 rounded-full" />
              <div className="mt-6 flex items-center justify-between">
                <SkeletonLine className="h-4 w-16 rounded-full" />
                <SkeletonLine className="h-4 w-10 rounded-full" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { Skeleton, SkeletonCard, SkeletonLine, SkeletonList } from "@/components/ui/Skeleton"

export function AdminStatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="grid grid-cols-4 gap-2 md:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} className="rounded-2xl p-2.5 md:rounded-[2rem] md:p-6">
          <Skeleton className="h-9 w-9 rounded-xl md:h-12 md:w-12 md:rounded-2xl" />
          <SkeletonLine className="mt-4 h-3 w-16 rounded-full" />
          <SkeletonLine className="mt-3 h-7 w-14 rounded-2xl" />
        </SkeletonCard>
      ))}
    </section>
  )
}

export function AdminTableSkeleton() {
  return (
    <SkeletonCard className="rounded-[1.75rem] p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-10 flex-1 rounded-2xl" />
          <SkeletonLine className="h-10 w-24 rounded-2xl" />
          <SkeletonLine className="h-10 w-28 rounded-2xl" />
        </div>
        <SkeletonList
          items={5}
          renderItem={() => (
            <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/[0.05] px-4 py-4">
              <div className="space-y-2">
                <SkeletonLine className="h-4 w-32 rounded-full" />
                <SkeletonLine className="h-3 w-24 rounded-full" />
              </div>
              <SkeletonLine className="h-8 w-20 rounded-full" />
            </div>
          )}
        />
      </div>
    </SkeletonCard>
  )
}

export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonCard className="rounded-[2rem] p-5">
        <SkeletonLine className="h-3 w-24 rounded-full" />
        <SkeletonLine className="mt-3 h-8 w-72 rounded-2xl" />
        <SkeletonLine className="mt-2 h-4 w-96 max-w-full rounded-full" />
      </SkeletonCard>
      <SkeletonCard className="rounded-[2rem] p-0 overflow-hidden">
        <SkeletonList
          items={5}
          renderItem={(index) => (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <SkeletonLine className="h-4 w-40 rounded-full" />
                  <SkeletonLine className="h-3 w-56 rounded-full" />
                </div>
                <SkeletonLine className="h-10 w-20 rounded-2xl" />
              </div>
              {index < 4 ? <div className="mt-4 h-px bg-white/[0.05]" /> : null}
            </div>
          )}
        />
      </SkeletonCard>
    </div>
  )
}

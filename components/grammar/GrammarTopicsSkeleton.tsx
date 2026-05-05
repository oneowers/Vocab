"use client"

import { Skeleton, SkeletonCard, SkeletonLine, SkeletonList } from "@/components/ui/Skeleton"

export function GrammarTopicsSkeleton() {
  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="space-y-6 px-4 pt-20">
        <SkeletonCard className="rounded-[28px] p-4">
          <SkeletonLine className="h-4 w-24 rounded-full" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[32px_1fr_24px] items-end gap-3">
                <SkeletonLine className="h-3 w-8 rounded-full" />
                <Skeleton className="h-16 rounded-[20px]" />
                <SkeletonLine className="h-3 w-4 rounded-full" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        <section className="space-y-3">
          <SkeletonLine className="h-3 w-28 rounded-full" />
          <SkeletonCard className="rounded-[32px] p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <div className="space-y-2">
                  <SkeletonLine className="h-5 w-32 rounded-xl" />
                  <SkeletonLine className="h-4 w-24 rounded-full" />
                </div>
              </div>
              <SkeletonLine className="h-6 w-12 rounded-full" />
            </div>
            <Skeleton className="mt-5 h-1.5 w-full rounded-full" />
          </SkeletonCard>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <SkeletonLine className="h-3 w-24 rounded-full" />
            <SkeletonLine className="h-3 w-12 rounded-full" />
          </div>

          <div className="space-y-8 pb-20">
            {["A1", "A2"].map((level) => (
              <div key={level} className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <SkeletonLine className="h-3 w-8 rounded-full" />
                  <Skeleton className="h-px flex-1 rounded-full" />
                </div>
                <SkeletonCard className="overflow-hidden rounded-[32px] border-white/[0.15] p-0">
                  <SkeletonList
                    items={3}
                    renderItem={(index) => (
                      <div className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-2">
                            <SkeletonLine className="h-4 w-36 rounded-full" />
                            <SkeletonLine className="h-3 w-24 rounded-full" />
                          </div>
                          <SkeletonLine className="h-5 w-12 rounded-full" />
                        </div>
                        {index < 2 ? <div className="mt-4 h-px bg-white/[0.05]" /> : null}
                      </div>
                    )}
                  />
                </SkeletonCard>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

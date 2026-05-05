"use client"

import { SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton"

export function StatsCardsSkeleton() {
  return (
    <section className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <SkeletonCard key={index} className="rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
          <SkeletonLine className="h-3 w-20 rounded-full" />
          <SkeletonLine className="mt-4 h-9 w-16 rounded-2xl" />
        </SkeletonCard>
      ))}
    </section>
  )
}

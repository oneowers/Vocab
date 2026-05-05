"use client"

import type { ComponentPropsWithoutRef, ReactNode } from "react"

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export function Skeleton({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div aria-hidden="true" className={joinClasses("ui-skeleton", className)} {...props} />
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <Skeleton className={joinClasses("h-4 rounded-xl", className)} />
}

export function SkeletonAvatar({ className = "" }: { className?: string }) {
  return <Skeleton className={joinClasses("h-12 w-12 rounded-full", className)} />
}

export function SkeletonCard({
  className = "",
  children
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={joinClasses("rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-4", className)}>
      {children}
    </div>
  )
}

export function SkeletonList({
  items = 4,
  className = "",
  renderItem
}: {
  items?: number
  className?: string
  renderItem: (index: number) => ReactNode
}) {
  return (
    <div className={joinClasses("space-y-3", className)}>
      {Array.from({ length: items }, (_, index) => (
        <div key={index}>{renderItem(index)}</div>
      ))}
    </div>
  )
}

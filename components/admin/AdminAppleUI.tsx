"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

import { AppleCard } from "@/components/AppleDashboardComponents"

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}

export function AdminSurface({
  children,
  className = ""
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <AppleCard className={cn("rounded-[30px] border-white/[0.08] bg-[#141416] shadow-[0_18px_48px_rgba(0,0,0,0.28)]", className)}>
      {children}
    </AppleCard>
  )
}

export function AdminPageIntro({
  eyebrow = "LexiFlow Admin",
  title,
  description,
  actions
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <AdminSurface className="overflow-hidden p-5 md:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/35">{eyebrow}</p>
          <h1 className="mt-2 text-[30px] font-black tracking-tight text-white md:text-[38px]">{title}</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-white/48 md:text-[15px]">
            {description}
          </p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div> : null}
      </div>
    </AdminSurface>
  )
}

export function AdminStatGrid({
  children,
  className = ""
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={cn("grid gap-3 md:gap-4 xl:grid-cols-4", className)}>{children}</section>
}

export function AdminStatCard({
  label,
  value,
  icon,
  tone = "bg-[#0A84FF]/16 text-[#78B8FF]",
  hint
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: string
  hint?: ReactNode
}) {
  return (
    <AdminSurface className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/[0.08]", tone)}>
          {icon}
        </div>
        {hint ? <div className="text-right text-[12px] font-semibold text-white/30">{hint}</div> : null}
      </div>
      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-white/32">{label}</p>
      <p className="mt-2 text-[28px] font-black tracking-tight text-white md:text-[34px]">{value}</p>
    </AdminSurface>
  )
}

export function AdminToolbar({
  children,
  className = ""
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      {children}
    </div>
  )
}

export function AdminControlGroup({
  children,
  className = ""
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("flex flex-wrap items-center gap-2.5", className)}>{children}</div>
}

export function AdminSearchInput({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return (
    <div className={cn("flex h-12 min-w-[220px] items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", className)}>
      <Search size={16} className="text-white/28" />
      <input
        {...props}
        className="h-full w-full border-0 bg-transparent p-0 text-[14px] text-white outline-none placeholder:text-white/28"
      />
    </div>
  )
}

export function AdminPillButton({
  children,
  tone = "secondary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  tone?: "primary" | "secondary" | "danger"
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[#0A84FF] text-white shadow-[0_10px_26px_rgba(10,132,255,0.26)]"
      : tone === "danger"
        ? "bg-[#FF453A]/14 text-[#FF8F87] border border-[#FF453A]/18"
        : "bg-white/[0.05] text-white/78 border border-white/[0.08]"

  return (
    <button
      {...props}
      className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-bold transition-all active:scale-[0.98] disabled:opacity-50", toneClass, className)}
    >
      {children}
    </button>
  )
}

export function AdminBadge({
  children,
  tone = "neutral"
}: {
  children: ReactNode
  tone?: "neutral" | "success" | "warning" | "danger" | "accent"
}) {
  const toneClass =
    tone === "success"
      ? "bg-[#34C759]/14 text-[#79E396]"
      : tone === "warning"
        ? "bg-[#FF9F0A]/14 text-[#FFC066]"
        : tone === "danger"
          ? "bg-[#FF453A]/14 text-[#FF8F87]"
          : tone === "accent"
            ? "bg-[#0A84FF]/14 text-[#79B9FF]"
            : "bg-white/[0.06] text-white/52"

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]", toneClass)}>
      {children}
    </span>
  )
}

export function AdminPagination({
  page,
  totalPages,
  onPrevious,
  onNext
}: {
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <AdminSurface className="p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-[13px] font-semibold text-white/42">
          Page <span className="text-white/78">{page}</span> of <span className="text-white/78">{totalPages}</span>
        </p>
        <div className="flex gap-2">
          <AdminPillButton type="button" onClick={onPrevious} disabled={page === 1}>
            <ChevronLeft size={16} />
            Previous
          </AdminPillButton>
          <AdminPillButton type="button" onClick={onNext} disabled={page >= totalPages}>
            Next
            <ChevronRight size={16} />
          </AdminPillButton>
        </div>
      </div>
    </AdminSurface>
  )
}

export function AdminEmptyState({
  title,
  description,
  action
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <AdminSurface className="p-8 text-center md:p-10">
      <p className="text-[18px] font-bold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-white/42">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </AdminSurface>
  )
}

export function AdminInfoRow({
  label,
  value
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] bg-white/[0.03] px-4 py-3">
      <span className="text-[13px] font-semibold text-white/42">{label}</span>
      <span className="text-[14px] font-bold text-white">{value}</span>
    </div>
  )
}

export function AdminLinkChip({
  href,
  children
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] px-4 text-[14px] font-bold text-white/82 transition-all active:scale-[0.98]"
    >
      {children}
    </Link>
  )
}

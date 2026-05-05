import type { ReactNode } from "react"

import { AdminSurface } from "@/components/admin/AdminAppleUI"

interface AdminTableProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  hideHeaderText?: boolean
  surfaceClassName?: string
  headerClassName?: string
  contentClassName?: string
}

export function AdminTable({
  title,
  subtitle,
  actions,
  children,
  hideHeaderText = false,
  surfaceClassName = "",
  headerClassName = "",
  contentClassName = ""
}: AdminTableProps) {
  return (
    <AdminSurface className={`overflow-visible p-0 ${surfaceClassName}`}>
      <div
        className={`sticky top-[-1px] z-30 rounded-t-[30px] bg-[#141416]/94 backdrop-blur-xl ${
          hideHeaderText ? "p-4 md:p-5" : "flex flex-col gap-5 border-b border-white/[0.06] p-6 md:p-8"
        } ${headerClassName}`}
      >
        {!hideHeaderText ? (
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/28">Data Surface</p>
            <h2 className="mt-2 text-[24px] font-black tracking-tight text-white">{title}</h2>
            {subtitle ? <p className="mt-2 text-[14px] leading-6 text-white/42 md:text-[15px]">{subtitle}</p> : null}
          </div>
        ) : null}
        {actions ? <div className="w-full">{actions}</div> : null}
      </div>
      <div className={`mt-1 overflow-x-auto p-5 md:p-8 ${contentClassName}`}>{children}</div>
    </AdminSurface>
  )
}

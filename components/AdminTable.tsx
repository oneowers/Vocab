import type { ReactNode } from "react"

interface AdminTableProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminTable({
  title,
  subtitle,
  actions,
  children
}: AdminTableProps) {
  return (
    <section className="panel-admin rounded-[2rem] p-5">
      <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  )
}


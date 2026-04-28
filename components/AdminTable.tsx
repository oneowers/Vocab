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
    <section className="panel-admin rounded-[2rem] p-0 overflow-visible">
      <div className="sticky top-[-1px] z-30 flex flex-col gap-5 border-b border-white/[0.06] bg-[#151519]/95 p-6 backdrop-blur-md first:rounded-t-[2rem] md:p-8">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-ink">{title}</h2>
          {subtitle ? <p className="mt-1.5 text-[15px] text-muted leading-relaxed">{subtitle}</p> : null}
        </div>
        {actions && <div className="w-full">{actions}</div>}
      </div>
      <div className="p-5 md:p-8 mt-2 overflow-x-auto">{children}</div>
    </section>
  )
}

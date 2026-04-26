import { formatDateLabel } from "@/lib/date"
import type { ChartPoint } from "@/lib/types"

interface CSSBarChartProps {
  title: string
  points: ChartPoint[]
  tone?: "ink" | "gold" | "green" | "rose"
  heightClassName?: string
  summaryLabel?: string
  periodLabel?: string
  valueSuffix?: string
}

const toneMap = {
  ink: "linear-gradient(180deg, var(--accent) 0%, var(--text-primary) 100%)",
  gold: "linear-gradient(180deg, var(--warning) 0%, var(--accent) 100%)",
  green: "linear-gradient(180deg, var(--success) 0%, var(--accent) 100%)",
  rose: "linear-gradient(180deg, var(--destructive) 0%, var(--accent) 100%)"
} satisfies Record<NonNullable<CSSBarChartProps["tone"]>, string>

export function CSSBarChart({
  title,
  points,
  tone = "ink",
  heightClassName = "h-40",
  summaryLabel,
  periodLabel,
  valueSuffix = ""
}: CSSBarChartProps) {
  const peak = Math.max(...points.map((point) => point.value), 1)
  const gridClassName = points.length > 7 ? "grid-cols-10" : "grid-cols-7"
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const summary = summaryLabel ? `${total}${valueSuffix} ${summaryLabel}` : `Last ${points.length} days`

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <span className="text-xs uppercase tracking-[0.24em] text-quiet">
          {periodLabel || summary}
        </span>
      </div>
      <div className={`mt-6 grid ${gridClassName} gap-2 ${heightClassName}`}>
        {points.map((point) => (
          <div key={point.date} className="flex min-w-0 flex-col justify-end">
            <div className="flex-1 rounded-2xl bg-bg-secondary p-1">
              <div
                className="w-full rounded-[1rem] transition-all"
                style={{
                  background: toneMap[tone],
                  height: `${Math.max((point.value / peak) * 100, point.value > 0 ? 8 : 0)}%`
                }}
              />
            </div>
            <span className="mt-2 truncate text-center text-[11px] text-quiet">
              {point.label || formatDateLabel(point.date)}
            </span>
            <span className="text-center text-[11px] font-medium text-ink">
              {point.value}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

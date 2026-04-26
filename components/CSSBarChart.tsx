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
  ink: "var(--accent)",
  gold: "var(--warning)",
  green: "var(--success)",
  rose: "var(--destructive)"
} satisfies Record<NonNullable<CSSBarChartProps["tone"]>, string>

function formatAxisValue(value: number) {
  if (value >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}M`
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`
  }

  return String(value)
}

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
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const summary = summaryLabel ? `${total}${valueSuffix} ${summaryLabel}` : `Last ${points.length} days`
  const ticks = [0, 0.33, 0.66, 1].map((step) => Math.round(peak * step))

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-[22px] font-bold tracking-[-0.5px] text-ink">{title}</h2>
        <span className="text-xs uppercase tracking-[0.24em] text-quiet">
          {periodLabel || summary}
        </span>
      </div>

      <div className="mt-6">
        <div className="relative pl-16">
          <div className={`relative ${heightClassName}`}>
            {ticks.map((tick, index) => {
              const bottom = `${(index / (ticks.length - 1)) * 100}%`

              return (
                <div
                  key={`${title}-tick-${tick}-${index}`}
                  className="absolute inset-x-0"
                  style={{ bottom }}
                >
                  <div className="absolute -left-16 -translate-y-1/2 text-right text-[11px] font-medium text-quiet">
                    {formatAxisValue(tick)}
                    {valueSuffix}
                  </div>
                  <div className="border-t border-separator" />
                </div>
              )
            })}

            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-3">
              {points.map((point) => {
                const barHeight = Math.max((point.value / peak) * 100, point.value > 0 ? 8 : 0)

                return (
                <div
                  key={point.date}
                  className="relative flex h-full min-w-0 flex-1 flex-col justify-end"
                >
                  <span
                    className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-bg-primary/95 px-2 py-0.5 text-center text-[11px] font-semibold text-text-primary shadow-subtle"
                    style={{
                      bottom:
                        point.value > 0
                          ? `clamp(8px, calc(${barHeight}% + 8px), calc(100% - 20px))`
                          : "8px"
                    }}
                  >
                    {point.value}
                    {valueSuffix}
                  </span>
                  <div
                    className="w-full rounded-t-[8px] transition-all"
                    style={{
                      background: toneMap[tone],
                      height: `${barHeight}%`
                    }}
                  />
                </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {points.map((point) => (
              <div key={`${point.date}-label`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="truncate text-center text-[12px] font-medium text-quiet">
                  {point.label || formatDateLabel(point.date)}
                </span>
                <span className="text-center text-[11px] font-semibold text-ink">
                  {point.value}
                  {valueSuffix}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

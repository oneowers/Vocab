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
  ink: {
    bar: "var(--accent)",
    glow: "rgba(0,122,255,0.28)",
    gradient: "linear-gradient(180deg, rgba(0,122,255,0.9) 0%, rgba(0,122,255,0.55) 100%)"
  },
  gold: {
    bar: "var(--warning)",
    glow: "rgba(255,159,10,0.28)",
    gradient: "linear-gradient(180deg, rgba(255,159,10,0.95) 0%, rgba(255,159,10,0.55) 100%)"
  },
  green: {
    bar: "var(--success)",
    glow: "rgba(52,199,89,0.28)",
    gradient: "linear-gradient(180deg, rgba(52,199,89,0.95) 0%, rgba(52,199,89,0.55) 100%)"
  },
  rose: {
    bar: "var(--destructive)",
    glow: "rgba(255,69,58,0.28)",
    gradient: "linear-gradient(180deg, rgba(255,69,58,0.95) 0%, rgba(255,69,58,0.55) 100%)"
  }
} satisfies Record<NonNullable<CSSBarChartProps["tone"]>, { bar: string; glow: string; gradient: string }>

function formatAxisValue(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

export function CSSBarChart({
  title,
  points,
  tone = "ink",
  heightClassName = "h-36",
  summaryLabel,
  periodLabel,
  valueSuffix = ""
}: CSSBarChartProps) {
  const peak = Math.max(...points.map((p) => p.value), 1)
  const total = points.reduce((sum, p) => sum + p.value, 0)
  const summary = summaryLabel ? `${total}${valueSuffix} ${summaryLabel}` : `Last ${points.length} days`
  const ticks = [0, 0.5, 1].map((step) => Math.round(peak * step))
  const colors = toneMap[tone]

  return (
    <section className="panel-admin rounded-[2rem] p-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-quiet">
            {periodLabel || summary}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[13px] font-bold"
          style={{
            background: colors.glow,
            color: colors.bar
          }}
        >
          {total}{valueSuffix}
        </span>
      </div>

      {/* Chart */}
      <div className="mt-5">
        <div className="relative pl-10">
          <div className={`relative ${heightClassName}`}>
            {/* Grid lines */}
            {ticks.map((tick, index) => {
              const bottom = `${(index / (ticks.length - 1)) * 100}%`
              return (
                <div
                  key={`${title}-tick-${tick}-${index}`}
                  className="absolute inset-x-0"
                  style={{ bottom }}
                >
                  <div className="absolute -left-10 -translate-y-1/2 text-right text-[10px] font-semibold text-quiet/70">
                    {formatAxisValue(tick)}{valueSuffix}
                  </div>
                  <div
                    className="border-t"
                    style={{ borderColor: "var(--separator)", opacity: index === 0 ? 0.6 : 0.3 }}
                  />
                </div>
              )
            })}

            {/* Bars */}
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-2">
              {points.map((point) => {
                const barHeight = Math.max((point.value / peak) * 100, point.value > 0 ? 6 : 0)

                return (
                  <div
                    key={point.date}
                    className="group relative flex h-full min-w-0 flex-1 flex-col justify-end"
                  >
                    {/* Tooltip on hover */}
                    <span
                      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1 rounded-lg px-2 py-0.5 text-center text-[11px] font-bold opacity-0 shadow-subtle transition-all duration-150 group-hover:opacity-100"
                      style={{
                        bottom: point.value > 0
                          ? `clamp(8px, calc(${barHeight}% + 6px), calc(100% - 24px))`
                          : "8px",
                        background: colors.bar,
                        color: "#fff"
                      }}
                    >
                      {point.value}{valueSuffix}
                    </span>

                    {/* Bar */}
                    <div
                      className="w-full rounded-t-[6px] transition-all duration-300 group-hover:brightness-110"
                      style={{
                        background: colors.gradient,
                        height: `${barHeight}%`,
                        boxShadow: barHeight > 10 ? `0 -2px 12px ${colors.glow}` : "none"
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="mt-2 flex gap-2">
            {points.map((point) => (
              <div key={`${point.date}-label`} className="flex min-w-0 flex-1 flex-col items-center">
                <span className="truncate text-center text-[11px] font-medium text-quiet">
                  {point.label || formatDateLabel(point.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

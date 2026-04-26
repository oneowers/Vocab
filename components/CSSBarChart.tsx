import { formatDateLabel } from "@/lib/date"
import type { ChartPoint } from "@/lib/types"

interface CSSBarChartProps {
  title: string
  points: ChartPoint[]
  tone?: "ink" | "gold" | "green" | "rose"
  heightClassName?: string
}

const toneMap = {
  ink: "from-[#1A1A2E] to-[#40406A]",
  gold: "from-[#F59E0B] to-[#FBBF24]",
  green: "from-[#137333] to-[#5AA469]",
  rose: "from-[#C5221F] to-[#EA6B66]"
}

export function CSSBarChart({
  title,
  points,
  tone = "ink",
  heightClassName = "h-40"
}: CSSBarChartProps) {
  const peak = Math.max(...points.map((point) => point.value), 1)
  const gridClassName = points.length > 7 ? "grid-cols-10" : "grid-cols-7"

  return (
    <section className="panel rounded-[2rem] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <span className="text-xs uppercase tracking-[0.24em] text-quiet">
          Last {points.length} days
        </span>
      </div>
      <div className={`mt-6 grid ${gridClassName} gap-2 ${heightClassName}`}>
        {points.map((point) => (
          <div key={point.date} className="flex min-w-0 flex-col justify-end">
            <div className="flex-1 rounded-2xl bg-[#F4F5F7] p-1">
              <div
                className={`w-full rounded-[1rem] bg-gradient-to-t ${toneMap[tone]} transition-all`}
                style={{
                  height: `${Math.max((point.value / peak) * 100, point.value > 0 ? 8 : 0)}%`
                }}
              />
            </div>
            <span className="mt-2 truncate text-center text-[11px] text-quiet">
              {point.label || formatDateLabel(point.date)}
            </span>
            <span className="text-center text-[11px] font-medium text-ink">
              {point.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

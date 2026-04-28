"use client"

import { useState } from "react"

import type { AdminAnalyticsPayload } from "@/lib/types"

type SeedCatalogData = AdminAnalyticsPayload["seedCatalog"]

interface SeedCatalogSectionProps {
  data: SeedCatalogData
}

const SLICES = [
  { key: "published" as const, label: "Published", color: "#34c759", glow: "rgba(52,199,89,0.35)" },
  { key: "enriched" as const, label: "Enriched", color: "#007aff", glow: "rgba(0,122,255,0.35)" },
  { key: "imported" as const, label: "Imported", color: "#ff9f0a", glow: "rgba(255,159,10,0.35)" },
  { key: "failed" as const, label: "Failed", color: "#ff453a", glow: "rgba(255,69,58,0.35)" }
]

const LEVEL_COLORS: Record<string, string> = {
  A1: "#34c759",
  A2: "#30d158",
  B1: "#007aff",
  B2: "#0a84ff",
  C1: "#bf5af2",
  C2: "#9b59b6"
}

function DonutChart({ data, hovered, onHover }: {
  data: SeedCatalogData
  hovered: string | null
  onHover: (key: string | null) => void
}) {
  const total = Math.max(data.imported, 1)
  const cx = 80; const cy = 80; const R = 62; const r = 40

  const segments: Array<{ slice: typeof SLICES[number]; startAngle: number; endAngle: number }> = []
  let current = -Math.PI / 2
  for (const slice of SLICES) {
    const angle = (data[slice.key] / total) * 2 * Math.PI
    segments.push({ slice, startAngle: current, endAngle: current + angle })
    current += angle
  }

  function arcPath(sa: number, ea: number, oR: number, iR: number, scale = 1) {
    const g = 0.025; const s = sa + g; const e = ea - g
    if (e - s <= 0) return ""
    const sO = oR * scale; const sI = iR * scale
    const x1 = cx + sO * Math.cos(s); const y1 = cy + sO * Math.sin(s)
    const x2 = cx + sO * Math.cos(e); const y2 = cy + sO * Math.sin(e)
    const x3 = cx + sI * Math.cos(e); const y3 = cy + sI * Math.sin(e)
    const x4 = cx + sI * Math.cos(s); const y4 = cy + sI * Math.sin(s)
    const large = e - s > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${sO} ${sO} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${sI} ${sI} 0 ${large} 0 ${x4} ${y4} Z`
  }

  return (
    <svg viewBox="0 0 160 160" className="w-[130px] flex-shrink-0" aria-label="Seed catalog donut chart">
      <defs>
        {SLICES.map((s) => (
          <filter key={s.key} id={`glow-${s.key}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>
      <circle cx={cx} cy={cy} r={(R + r) / 2} strokeWidth={R - r} stroke="var(--bg-secondary)" fill="none" />
      {segments.map(({ slice, startAngle, endAngle }) => (
        <path
          key={slice.key}
          d={arcPath(startAngle, endAngle, R, r, hovered === slice.key ? 1.07 : 1)}
          fill={slice.color}
          opacity={hovered && hovered !== slice.key ? 0.35 : 1}
          filter={hovered === slice.key ? `url(#glow-${slice.key})` : undefined}
          style={{ transition: "opacity 0.18s", cursor: "pointer" }}
          onMouseEnter={() => onHover(slice.key)}
          onMouseLeave={() => onHover(null)}
        />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: "var(--text-primary)" }}>
        {hovered ? data[hovered as keyof SeedCatalogData] as number : data.imported}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" style={{ fontSize: 9, fill: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>
        {hovered ? SLICES.find(s => s.key === hovered)?.label : "imported"}
      </text>
    </svg>
  )
}

export function SeedCatalogSection({ data }: SeedCatalogSectionProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const totalByLevel = Object.values(data.byLevel).reduce((a, b) => a + b, 0) || 1

  return (
    <section className="panel-admin rounded-[2rem] p-5">
      {/* Header - Always at the top */}
      <div className="mb-5">
        <p className="section-label">Seed catalog</p>
        <h2 className="mt-0.5 text-[16px] font-bold text-ink">CEFR Dataset Progress</h2>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* Donut - Centered on mobile */}
        <div className="mx-auto flex-shrink-0 md:mx-0">
          <DonutChart data={data} hovered={hovered} onHover={setHovered} />
        </div>

        {/* Content: legend + levels */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Legend row */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4 md:grid-cols-2">
            {SLICES.map((slice) => {
              const val = data[slice.key]
              const pct = data.imported > 0 ? Math.round((val / data.imported) * 100) : 0
              return (
                <button
                  key={slice.key}
                  type="button"
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-bg-secondary"
                  style={{ background: hovered === slice.key ? "var(--bg-secondary)" : undefined }}
                  onMouseEnter={() => setHovered(slice.key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: slice.color }} />
                  <span className="text-[12px] font-medium text-muted">{slice.label}</span>
                  <span className="ml-auto text-[12px] font-bold text-ink">{val}</span>
                  <span className="text-[11px] text-quiet">{pct}%</span>
                </button>
              )
            })}
          </div>

          {/* Level bars */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 md:grid-cols-2">
            {Object.entries(data.byLevel).map(([level, value]) => {
              const pct = Math.round((value / totalByLevel) * 100)
              const color = LEVEL_COLORS[level] ?? "#8e8e93"
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className="w-6 text-[11px] font-bold" style={{ color }}>{level}</span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-bg-secondary">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        transition: "width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)"
                      }}
                    />
                  </div>
                  <span className="w-7 text-right text-[11px] font-semibold text-ink">{value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import React from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts"
import { motion } from "framer-motion"
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
    stroke: "var(--accent)",
    glow: "rgba(0,122,255,0.28)",
    fill: "var(--accent)"
  },
  gold: {
    stroke: "var(--warning)",
    glow: "rgba(255,159,10,0.28)",
    fill: "var(--warning)"
  },
  green: {
    stroke: "var(--success)",
    glow: "rgba(52,199,89,0.28)",
    fill: "var(--success)"
  },
  rose: {
    stroke: "var(--destructive)",
    glow: "rgba(255,69,58,0.28)",
    fill: "var(--destructive)"
  }
} satisfies Record<NonNullable<CSSBarChartProps["tone"]>, { stroke: string; glow: string; fill: string }>

export function CSSBarChart({
  title,
  points,
  tone = "ink",
  heightClassName = "h-40",
  summaryLabel,
  periodLabel,
  valueSuffix = ""
}: CSSBarChartProps) {
  const total = points.reduce((sum, p) => sum + p.value, 0)
  const summary = summaryLabel ? `${total}${valueSuffix} ${summaryLabel}` : `Last ${points.length} days`
  const colors = toneMap[tone]

  const chartData = points.map(p => ({
    ...p,
    displayLabel: p.label || formatDateLabel(p.date)
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2 shadow-xl backdrop-blur-md">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            {payload[0].payload.displayLabel}
          </p>
          <p className="text-[14px] font-black text-white">
            {payload[0].value}{valueSuffix}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <section className="panel-admin rounded-[2rem] p-6 bg-bg-secondary/40 border border-line backdrop-blur-sm shadow-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-6">
        <div>
          <h2 className="text-[18px] font-black tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-quiet">
            {periodLabel || summary}
          </p>
        </div>
        <div 
          className="rounded-xl px-3 py-1.5 text-[14px] font-black border"
          style={{
            background: colors.glow,
            borderColor: `${colors.stroke}33`,
            color: colors.stroke
          }}
        >
          {total}{valueSuffix}
        </div>
      </div>

      {/* Chart */}
      <div className={`relative w-full ${heightClassName} -mx-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${tone}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.stroke} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={colors.stroke} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: colors.stroke, strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.2 }} 
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={colors.stroke} 
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#gradient-${tone})`}
              activeDot={{ r: 5, strokeWidth: 0, fill: colors.stroke }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* X-Axis labels simplified */}
      <div className="mt-4 flex justify-between px-2">
        <span className="text-[10px] font-bold text-quiet/50 uppercase tracking-widest">{chartData[0]?.displayLabel}</span>
        <span className="text-[10px] font-bold text-quiet/50 uppercase tracking-widest">{chartData[chartData.length - 1]?.displayLabel}</span>
      </div>
    </section>
  )
}

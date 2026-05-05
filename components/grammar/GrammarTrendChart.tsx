"use client"

import React from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts"
import { motion } from "framer-motion"

interface GrammarTrendChartProps {
  data: Array<{ date: string; value: number }>
}

export function GrammarTrendChart({ data }: GrammarTrendChartProps) {
  const chartData = data.map(item => {
    const d = new Date(item.date)
    return {
      ...item,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }
  })

  const values = data.map(d => d.value)
  const minVal = Math.min(...values, 0)
  const maxVal = Math.max(...values, 10)
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 shadow-xl backdrop-blur-md">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">{payload[0].payload.label}</p>
          <p className="text-[14px] font-black text-white">
            {payload[0].value} <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">pts</span>
          </p>
        </div>
      )
    }
    return null
  }

  const last = data[data.length - 1]?.value || 0
  
  const getStrokeColor = () => {
    if (last < 0) return "#FF3B30" 
    if (last < 50) return "#34C759" 
    return "#007AFF"
  }
  const strokeColor = getStrokeColor()

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full relative"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[32px] font-black text-white tracking-tighter leading-none">
              {last}
            </span>
            <span className="text-[14px] font-bold text-white/20 uppercase tracking-widest">pts</span>
          </div>
        </div>
      </div>

      <div className="h-[100px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} 
            />
            <YAxis domain={[minVal - 5, maxVal + 5]} hide />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={strokeColor} 
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

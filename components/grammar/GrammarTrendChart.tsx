"use client"

import React from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts"
import { motion } from "framer-motion"

interface GrammarTrendChartProps {
  data: Array<{ date: string; value: number }>
}

export function GrammarTrendChart({ data }: GrammarTrendChartProps) {
  // Add formatted date for tooltips
  const chartData = data.map(item => {
    const d = new Date(item.date)
    return {
      ...item,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }
  })

  // Calculate dynamic domain for YAxis to give some padding
  const values = data.map(d => d.value)
  const minVal = Math.min(...values, 0)
  const maxVal = Math.max(...values, 10)
  
  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2 shadow-xl backdrop-blur-md">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">{payload[0].payload.label}</p>
          <p className="text-[14px] font-black text-white">
            {payload[0].value} <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">pts</span>
          </p>
        </div>
      )
    }
    return null
  }

  const first = data[0]?.value || 0
  const last = data[data.length - 1]?.value || 0
  const isUp = last >= first
  const strokeColor = isUp ? "#34d399" : "#fb7185" // emerald-400 : rose-400

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-[24px] border border-white/5 bg-[#12141a]/60 p-5 relative overflow-hidden backdrop-blur-md shadow-lg"
    >
      <div className="absolute top-0 right-0 p-5">
        <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${isUp ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'}`}>
          14D Trend
        </span>
      </div>
      
      <div className="mb-6 relative z-10">
        <h3 className="text-[13px] font-bold text-white/50 uppercase tracking-widest">Total Progress</h3>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-[32px] font-black text-white tracking-tighter leading-none">
            {last}
          </span>
          <span className="text-[13px] font-bold text-white/30 uppercase tracking-widest mb-1">pts</span>
        </div>
      </div>

      <div className="h-[140px] w-full -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <YAxis domain={[minVal - 20, maxVal + 20]} hide />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={strokeColor} 
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              activeDot={{ r: 5, strokeWidth: 0, fill: strokeColor }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

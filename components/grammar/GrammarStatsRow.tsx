"use client"

import React from "react"
import type { GrammarSkillsPayload } from "@/lib/types"

export function GrammarStatsRow({ payload }: { payload: GrammarSkillsPayload }) {
  const learningCount = payload.items.filter(i => i.score >= -30 && i.score < 30 && i.evidenceCount > 0).length
  const strongCount = payload.items.filter(i => i.score >= 30).length
  const totalMistakes = payload.items.reduce((acc, i) => acc + i.negativeEvidenceCount, 0)

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-bold uppercase tracking-wider">
      <StatItem label="Weak" value={payload.weakCount} color="text-rose-400" />
      <span className="text-white/10">·</span>
      <StatItem label="Learning" value={learningCount} color="text-amber-400" />
      <span className="text-white/10">·</span>
      <StatItem label="Strong" value={strongCount} color="text-emerald-400" />
      <span className="text-white/10">·</span>
      <StatItem label="Mistakes" value={totalMistakes} color="text-white/40" />
    </div>
  )
}

function StatItem({ 
  label, 
  value, 
  color 
}: { 
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-white/80">{value}</span>
      <span className={`${color} opacity-80`}>{label}</span>
    </div>
  )
}

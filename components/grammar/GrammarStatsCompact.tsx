"use client"

import React from "react"
import { 
  AlertCircle, 
  BookOpen, 
  CheckCircle2, 
  History 
} from "lucide-react"
import type { GrammarSkillsPayload } from "@/lib/types"

export function GrammarStatsCompact({ payload }: { payload: GrammarSkillsPayload }) {
  const learningCount = payload.items.filter(i => i.score >= -30 && i.score < 30 && i.evidenceCount > 0).length
  const strongCount = payload.items.filter(i => i.score >= 30).length
  const totalMistakes = payload.items.reduce((acc, i) => acc + i.negativeEvidenceCount, 0)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 md:grid md:grid-cols-4 md:gap-4 md:p-4">
      <StatItem label="Weak" value={payload.weakCount} color="text-rose-400" icon={<AlertCircle size={10} />} />
      <StatItem label="Learning" value={learningCount} color="text-amber-400" icon={<BookOpen size={10} />} />
      <StatItem label="Strong" value={strongCount} color="text-emerald-400" icon={<CheckCircle2 size={10} />} />
      <StatItem label="Mistakes" value={totalMistakes} color="text-white/40" icon={<History size={10} />} />
    </div>
  )
}

function StatItem({ 
  label, 
  value, 
  color, 
  icon 
}: { 
  label: string
  value: number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 md:flex-col md:items-start md:gap-1">
      <div className="flex items-center gap-1">
        <span className={color}>{icon}</span>
        <span className="text-[14px] font-black text-white md:text-[20px]">{value}</span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
        {label}
      </span>
    </div>
  )
}

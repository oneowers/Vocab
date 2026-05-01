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
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
      <StatBox 
        label="Weak" 
        value={payload.weakCount} 
        color="rose" 
        icon={<AlertCircle size={12} />} 
      />
      <StatBox 
        label="Learning" 
        value={learningCount} 
        color="amber" 
        icon={<BookOpen size={12} />} 
      />
      <StatBox 
        label="Strong" 
        value={strongCount} 
        color="emerald" 
        icon={<CheckCircle2 size={12} />} 
      />
      <StatBox 
        label="Mistakes" 
        value={totalMistakes} 
        color="white" 
        icon={<History size={12} />} 
      />
    </div>
  )
}

function StatBox({ 
  label, 
  value, 
  color, 
  icon 
}: { 
  label: string
  value: number
  color: "rose" | "amber" | "emerald" | "white"
  icon: React.ReactNode
}) {
  const colors = {
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/10",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10",
    white: "text-white/40 bg-white/5 border-white/5"
  }

  return (
    <div className={`flex items-center justify-between rounded-2xl border p-3 md:p-4 ${colors[color]}`}>
      <div className="flex flex-col">
        <span className="text-[18px] font-black leading-none text-white md:text-[24px]">
          {value}
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
          {label}
        </span>
      </div>
      <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${colors[color]} border-none bg-white/5`}>
        {icon}
      </div>
    </div>
  )
}

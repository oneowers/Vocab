"use client"

import React from "react"
import { CheckCircle2, History, TrendingUp, Zap } from "lucide-react"
import type { GrammarSkillsPayload } from "@/lib/types"

export function GrammarStatsSummary({ payload }: { payload: GrammarSkillsPayload }) {
  const withEvidence = payload.items.filter(item => item.evidenceCount > 0)
  const totalMistakes = withEvidence.reduce((acc, item) => acc + item.negativeEvidenceCount, 0)
  const totalCorrect = withEvidence.reduce((acc, item) => acc + item.positiveEvidenceCount, 0)
  
  const learningCount = payload.items.filter(item => item.score >= -30 && item.score < 30 && item.evidenceCount > 0).length
  const strongCount = payload.items.filter(item => item.score >= 30).length

  return (
    <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:gap-4 md:px-0">
      <StatCard 
        label="Weak" 
        value={payload.weakCount} 
        icon={<TrendingUp size={16} />}
        color="rose"
      />
      <StatCard 
        label="Learning" 
        value={learningCount} 
        icon={<Zap size={16} />}
        color="amber"
      />
      <StatCard 
        label="Strong" 
        value={strongCount} 
        icon={<CheckCircle2 size={16} />}
        color="emerald"
      />
      <StatCard 
        label="Mistakes" 
        value={totalMistakes} 
        icon={<History size={16} />}
        color="rose"
      />
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color
}: { 
  label: string
  value: number
  icon: React.ReactNode
  color: "rose" | "amber" | "emerald"
}) {
  const colors = {
    rose: "text-rose-400 bg-rose-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10"
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05] md:p-5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl md:h-10 md:w-10 ${colors[color]}`}>
        {icon}
      </div>
      <div className="mt-3 md:mt-4">
        <p className="text-[24px] font-black text-white md:text-[32px]">
          {value}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">
          {label}
        </p>
      </div>
    </div>
  )
}

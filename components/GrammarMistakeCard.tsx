"use client"

import type { GrammarSeverity } from "@/lib/types"

interface GrammarMistakeCardProps {
  mistake: {
    type: "grammar" | "vocabulary" | "style"
    topicKey?: string
    original: string
    corrected: string
    explanationRu: string
    severity: GrammarSeverity
  }
}

export function GrammarMistakeCard({ mistake }: GrammarMistakeCardProps) {
  const severityColors = {
    low: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    medium: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    high: "bg-red-500/10 text-red-300 border-red-500/20"
  }

  return (
    <div className={`rounded-3xl border p-6 transition-all hover:bg-opacity-10 ${severityColors[mistake.severity] || "border-white/10 bg-white/5"}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${severityColors[mistake.severity]}`}>
          {mistake.severity} severity
        </span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/40 uppercase tracking-wider border border-white/5">
          {mistake.type}
        </span>
        {mistake.topicKey && (
          <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">
            {mistake.topicKey.replaceAll("_", " ")}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-medium opacity-60 line-through decoration-rose-500/40">
          {mistake.original}
        </p>
        <p className="text-[17px] font-black text-emerald-400">
          {mistake.corrected}
        </p>
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-white/70">
        {mistake.explanationRu}
      </p>
    </div>
  )
}

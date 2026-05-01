"use client"

import { CheckCircle2, AlertCircle } from "lucide-react"

interface WordUsageFeedbackProps {
  wordUsage?: Array<{
    word: string
    status: "correct" | "incorrect" | "missing"
    feedbackRu: string
  }>
}

export function WordUsageFeedback({ wordUsage }: WordUsageFeedbackProps) {
  if (!wordUsage || wordUsage.length === 0) return null

  return (
    <section>
      <h3 className="mb-4 text-[12px] font-extrabold uppercase tracking-widest text-white/30">
        Vocabulary usage
      </h3>
      <div className="space-y-3">
        {wordUsage.map((item, i) => (
          <div 
            key={i} 
            className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-white">{item.word}</span>
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                item.status === "correct" 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : item.status === "incorrect" 
                    ? "bg-rose-500/20 text-rose-400" 
                    : "bg-white/10 text-white/40"
              }`}>
                {item.status === "correct" ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <AlertCircle size={12} />
                )}
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">
              {item.feedbackRu}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

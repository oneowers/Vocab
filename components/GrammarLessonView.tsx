"use client"
 
import { ArrowLeft, Check, ChevronRight, HelpCircle, BookOpen, Volume2, Sparkles, AlertTriangle, Info } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { GrammarExercise } from "@/lib/grammar-content"
import { useToast } from "./Toast"
import { GrammarExerciseRunner } from "./GrammarExerciseRunner"
import { AppleHeader, AppleCard, AppleSpinner } from "@/components/AppleDashboardComponents"
 
interface GrammarLessonViewProps {
  topic: any
  onBack: () => void
  appSettings?: any
}
 
export function GrammarLessonView({ topic, onBack, appSettings }: GrammarLessonViewProps) {
  const [step, setStep] = useState<"THEORY" | "EXERCISES" | "COMPLETE">("THEORY")
  const [sessionScore, setSessionScore] = useState(0)
 
  if (!topic) return null
 
  if (step === "EXERCISES") {
    return (
      <GrammarExerciseRunner 
        topic={topic}
        onComplete={(scoreGained) => {
          setSessionScore(scoreGained)
          setStep("COMPLETE")
        }}
        onBack={() => setStep("THEORY")}
        appSettings={appSettings}
      />
    )
  }
 
  if (step === "COMPLETE") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-8 text-center relative overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-10 flex h-24 w-24 items-center justify-center rounded-[32px] bg-white/[0.05] text-white border border-white/[0.1] shadow-2xl relative z-10"
        >
          <Check size={48} strokeWidth={3} className="text-emerald-400" />
        </motion.div>
        
        <h1 className="text-[34px] font-black text-white tracking-tighter relative z-10 leading-tight">Lesson Mastered!</h1>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 space-y-2 relative z-10"
        >
          <p className="text-[14px] font-black text-white/20 uppercase tracking-[0.15em]">XP Reward</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-[48px] font-black tracking-tighter text-white">
              +{sessionScore}
            </span>
          </div>
        </motion.div>
 
        <p className="mt-10 text-[17px] text-white/40 leading-relaxed max-w-[280px] font-medium relative z-10">
          Excellent progress on <span className="text-white/80 font-bold">{topic.titleEn}</span>.
        </p>
 
        <button
          onClick={onBack}
          className="mt-16 w-full max-w-xs h-14 rounded-3xl bg-white text-black text-[17px] font-black hover:opacity-90 transition-all active:scale-[0.98] shadow-2xl relative z-10"
        >
          Return to Library
        </button>
      </div>
    )
  }
 
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <AppleHeader 
        title={topic.titleEn}
        onBack={onBack}
        sticky={true}
      />
 
      <main className="flex-1 pb-40">
        <div className="mx-auto max-w-xl px-4 pt-24 space-y-8">
          {/* Theory Section */}
          <section className="space-y-4">
             <div className="px-1">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-white/20">Objective</span>
                <p className="mt-2 text-[20px] font-bold text-white/80 leading-snug">
                  {topic.descriptionRu}
                </p>
             </div>
          </section>
 
          {/* Construction */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
               <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-white/20">Structure</h3>
            </div>
            
            <div className="grid gap-3">
              <AppleCard>
                <div className="p-6">
                  <span className="mb-3 block text-[11px] font-black uppercase tracking-wider text-emerald-400/60">Positive Statement</span>
                  <p className="text-[20px] font-black text-white tracking-tight leading-tight">{topic.formulas?.positive || "N/A"}</p>
                </div>
              </AppleCard>
 
              <AppleCard>
                <div className="p-6">
                  <span className="mb-3 block text-[11px] font-black uppercase tracking-wider text-rose-400/60">Negative Statement</span>
                  <p className="text-[20px] font-black text-white tracking-tight leading-tight">{topic.formulas?.negative || "N/A"}</p>
                </div>
              </AppleCard>
 
              <AppleCard>
                <div className="p-6">
                  <span className="mb-3 block text-[11px] font-black uppercase tracking-wider text-amber-400/60">Question Form</span>
                  <p className="text-[20px] font-black text-white tracking-tight leading-tight">{topic.formulas?.question || "N/A"}</p>
                </div>
              </AppleCard>
            </div>
          </section>
 
          {/* Usage Cases */}
          <section className="space-y-4">
            <div className="px-1">
               <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-white/20">When to use</h3>
            </div>
            <div className="grid gap-2">
              {(topic.usage || []).map((use: string, i: number) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 rounded-[24px] bg-white/[0.04] border border-white/[0.08] text-[15px] font-bold text-white/70">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span>{use}</span>
                </div>
              ))}
            </div>
          </section>
 
          {/* Examples */}
          <section className="space-y-4">
            <div className="px-1">
               <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-white/20">Real-world Examples</h3>
            </div>
            <div className="grid gap-3">
              {(topic.examples || []).map((ex: any, i: number) => (
                <AppleCard key={i}>
                  <div className="p-6">
                    <p className="text-[18px] font-black text-white leading-tight mb-3">{ex.en}</p>
                    <p className="text-[14px] font-bold text-white/30">{ex.ru}</p>
                  </div>
                </AppleCard>
              ))}
            </div>
          </section>
 
          {/* Common Mistakes */}
          {(topic.commonMistakes || []).length > 0 && (
            <section className="space-y-4">
              <div className="px-1">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-white/20">Common Errors</h3>
              </div>
              <div className="grid gap-4">
                {(topic.commonMistakes || []).map((mistake: any, i: number) => (
                  <div key={i} className="rounded-[32px] border border-white/[0.12] bg-[#161618] p-7 shadow-xl">
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <X size={20} strokeWidth={3} />
                        </div>
                        <span className="text-[17px] font-bold text-rose-300/40 line-through decoration-rose-500/40">
                          {mistake.wrong}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check size={20} strokeWidth={3} />
                        </div>
                        <span className="text-[18px] font-black text-white">
                          {mistake.correct}
                        </span>
                      </div>
                      <p className="text-[15px] font-bold leading-relaxed text-white/30 pt-4 border-t border-white/[0.05]">
                        {mistake.explanationRu}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
 
      {/* Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-6">
        <div className="mx-auto max-w-xl">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep("EXERCISES")}
            className="flex h-16 w-full items-center justify-center gap-4 rounded-3xl bg-white text-black text-[17px] font-black shadow-2xl transition-all hover:bg-white/95"
          >
            <span>Practice this Topic</span>
            <ChevronRight size={20} strokeWidth={3} />
          </motion.button>
        </div>
      </footer>
    </div>
  )
}

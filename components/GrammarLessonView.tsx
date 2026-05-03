"use client"
 
import { ArrowLeft, Check, ChevronRight, HelpCircle, Loader2, Sparkles, X, Info, AlertCircle, BookOpen } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GRAMMAR_TOPICS, type GrammarExercise } from "@/lib/grammar-content"
import { useToast } from "./Toast"
import { GrammarExerciseRunner } from "./GrammarExerciseRunner"
 
interface GrammarLessonViewProps {
  topicKey: string
  onBack: () => void
}
 
export function GrammarLessonView({ topicKey, onBack }: GrammarLessonViewProps) {
  const topic = GRAMMAR_TOPICS[topicKey]
  const [step, setStep] = useState<"THEORY" | "EXERCISES" | "COMPLETE">("THEORY")
 
  if (!topic) return null
 
  if (step === "EXERCISES") {
    return (
      <GrammarExerciseRunner 
        topic={topic}
        onComplete={() => setStep("COMPLETE")}
        onBack={() => setStep("THEORY")}
      />
    )
  }
 
  if (step === "COMPLETE") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c10] px-4 py-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
        >
          <Check size={48} strokeWidth={3} />
        </motion.div>
        <h1 className="text-[32px] font-black text-white tracking-tight">Lesson Mastered!</h1>
        <p className="mt-4 text-[16px] text-white/50 leading-relaxed max-w-xs font-medium">
          You've completed the <span className="text-white">{topic.titleEn}</span> lesson and exercises.
        </p>
        <button
          onClick={onBack}
          className="mt-12 w-full max-w-xs h-14 rounded-2xl bg-white text-black text-[16px] font-black hover:bg-white/90 transition-all active:scale-[0.98] shadow-xl"
        >
          Finish Lesson
        </button>
      </div>
    )
  }
 
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0c10]">
      {/* Dynamic Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 backdrop-blur-xl bg-[#0a0c10]/40 border-b border-white/[0.03]"
      >
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/60 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-0.5">Theory</span>
          <h2 className="text-[15px] font-black text-white tracking-tight">{topic.titleEn}</h2>
        </div>
        <div className="w-10" />
      </motion.header>
 
      <main className="flex-1 overflow-y-auto pb-32">
        {/* Hero Section */}
        <section className="relative px-6 py-12 overflow-hidden border-b border-white/[0.03]">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-black uppercase tracking-wider mb-6">
                <BookOpen size={12} />
                <span>Essential Grammar</span>
             </div>
             <h1 className="text-[36px] md:text-[44px] font-black text-white leading-[1.1] tracking-tight mb-4">
                {topic.titleEn}
             </h1>
             <p className="text-[18px] md:text-[20px] font-medium leading-relaxed text-white/70">
               {topic.descriptionRu}
             </p>
          </div>
        </section>
 
        <div className="mx-auto max-w-xl px-6 py-12 space-y-16">
          {/* Formulas */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="h-px flex-1 bg-white/[0.05]" />
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20">Construction</h3>
               <div className="h-px flex-1 bg-white/[0.05]" />
            </div>
            
            <div className="grid gap-4">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <div className="text-[40px] font-black text-emerald-400">+</div>
                </div>
                <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-emerald-400/80">Positive Statement</span>
                <p className="text-[18px] md:text-[20px] font-mono font-bold text-white tracking-tight">{topic.formulas.positive}</p>
              </motion.div>
 
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <div className="text-[40px] font-black text-rose-400">−</div>
                </div>
                <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-rose-400/80">Negative Statement</span>
                <p className="text-[18px] md:text-[20px] font-mono font-bold text-white tracking-tight">{topic.formulas.negative}</p>
              </motion.div>
 
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <div className="text-[40px] font-black text-amber-400">?</div>
                </div>
                <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-amber-400/80">Question Form</span>
                <p className="text-[18px] md:text-[20px] font-mono font-bold text-white tracking-tight">{topic.formulas.question}</p>
              </motion.div>
            </div>
          </section>
 
          {/* Usage Cases */}
          <section className="space-y-6">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-white/30 flex items-center gap-3">
               <Info size={16} />
               <span>When to use</span>
            </h3>
            <div className="grid gap-3">
              {topic.usage.map((use, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-[15px] font-medium text-white/80">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <span>{use}</span>
                </div>
              ))}
            </div>
          </section>
 
          {/* Examples */}
          <section className="space-y-6">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-white/30 flex items-center gap-3">
               <Sparkles size={16} />
               <span>Examples</span>
            </h3>
            <div className="grid gap-3">
              {topic.examples.map((ex, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 hover:bg-white/[0.03] transition-colors"
                >
                  <p className="text-[17px] font-black text-white leading-snug mb-2">{ex.en}</p>
                  <p className="text-[14px] font-medium text-white/40">{ex.ru}</p>
                </motion.div>
              ))}
            </div>
          </section>
 
          {/* Common Mistakes */}
          <section className="space-y-6">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-white/30 flex items-center gap-3">
               <AlertCircle size={16} />
               <span>Watch out!</span>
            </h3>
            <div className="grid gap-6">
              {topic.commonMistakes.map((mistake, i) => (
                <div key={i} className="rounded-[2.5rem] border border-rose-500/10 bg-rose-500/[0.02] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 text-rose-500/5 rotate-12">
                     <AlertCircle size={80} />
                  </div>
                  <div className="space-y-4 relative">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <X size={16} strokeWidth={3} />
                      </div>
                      <span className="text-[17px] font-bold text-rose-300/60 line-through decoration-rose-500/40">
                        {mistake.wrong}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <span className="text-[18px] font-black text-emerald-400">
                        {mistake.correct}
                      </span>
                    </div>
                    <p className="text-[15px] font-medium leading-relaxed text-white/50 pt-2 border-t border-white/[0.05]">
                      {mistake.explanationRu}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
 
      {/* Floating Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-6 pointer-events-none">
        <div className="mx-auto max-w-xl pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep("EXERCISES")}
            className="group flex h-16 w-full items-center justify-center gap-4 rounded-3xl bg-white text-black text-[16px] font-black shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all hover:bg-[#f0f0f0]"
          >
            <Sparkles size={18} className="text-black/40 group-hover:text-amber-500 transition-colors" />
            <span>Master this Topic</span>
            <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </footer>
    </div>
  )
}

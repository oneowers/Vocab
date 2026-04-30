"use client"

import { motion } from "framer-motion"
import { Sparkles, Crown, Zap, ArrowRight, CheckCircle2 } from "lucide-react"

export function ProUpgradeBanner() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-600 p-0.5 shadow-[0_0_40px_rgba(251,191,36,0.2)]"
      >
        <div className="flex h-full w-full items-center justify-center rounded-[1.9rem] bg-[#0d0d0f]">
          <Crown size={40} className="text-amber-400" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"
        >
          <Sparkles size={16} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="mb-3 text-3xl font-black tracking-tight text-white md:text-4xl">
          AI Coach is for <span className="text-amber-400">PRO</span>
        </h1>
        <p className="mx-auto max-w-sm text-lg font-medium text-white/50 leading-relaxed">
          Unlock unlimited personalized coaching, roleplays, and AI-generated stories to reach fluency faster.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-12 w-full max-w-md space-y-3"
      >
        <div className="grid gap-3 rounded-[2.5rem] border border-white/[0.06] bg-white/[0.03] p-6 text-left">
          <FeatureItem text="Unlimited AI Chat & Feedback" />
          <FeatureItem text="Advanced Roleplay Modes" />
          <FeatureItem text="AI Story Generation" />
          <FeatureItem text="CEFR Level Analysis" />
        </div>

        <button className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-white text-lg font-black text-black transition active:scale-95">
          <Zap size={20} fill="currentColor" />
          Upgrade to LexiFlow Pro
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        </button>
        
        <p className="text-sm font-semibold text-white/20 uppercase tracking-widest">
          Just $9.99 / month • Cancel anytime
        </p>
      </motion.div>
    </div>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 size={14} strokeWidth={3} />
      </div>
      <span className="text-[15px] font-bold text-white/80">{text}</span>
    </div>
  )
}

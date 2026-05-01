"use client"

import { useState } from "react"
import { Crown, Ticket, Check, Sparkles, Zap, ShieldCheck, Library } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

import { useToast } from "@/components/Toast"
import type { AppUserRecord } from "@/lib/types"

interface GetProViewProps {
  user: AppUserRecord | null
}

export function GetProView({ user }: GetProViewProps) {
  const { showToast } = useToast()
  const router = useRouter()
  const [promoCode, setPromoCode] = useState("")
  const [loading, setLoading] = useState(false)

  const isPro = user?.role === "PRO" || user?.role === "ADMIN"

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    if (!promoCode.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/pro/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Invalid promo code")
      }

      showToast("Promo code activated successfully! Welcome to PRO.", "success")
      setPromoCode("")
      
      // Refresh the page or user session
      setTimeout(() => {
        window.location.href = "/profile"
      }, 1000)
    } catch (error: any) {
      showToast(error.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="mb-12 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.3)] border border-amber-500/30"
        >
          <Crown className="text-amber-400" size={40} />
        </motion.div>
        
        <h1 className="mb-4 text-3xl font-black tracking-tight text-white md:text-5xl">
          Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">PRO</span>
        </h1>
        <p className="text-[16px] leading-relaxed text-white/50 max-w-md mx-auto">
          Unlock the full potential of LexiFlow and take your vocabulary learning to the next level.
        </p>
      </div>

      {isPro && (
        <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <Check className="text-emerald-400" size={24} />
          </div>
          <h2 className="mb-1 text-xl font-bold text-emerald-400">You are on the PRO plan!</h2>
          <p className="text-[14px] text-emerald-400/70">
            {user?.proUntil 
              ? `Your subscription is active until ${new Date(user.proUntil).toLocaleDateString()}` 
              : "You have lifetime access to PRO features."}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        <FeatureCard 
          icon={<Sparkles size={24} className="text-blue-400" />}
          title="Unlimited Daily Words"
          description="Remove the limit on how many words you can learn and claim every day."
        />
        <FeatureCard 
          icon={<Zap size={24} className="text-purple-400" />}
          title="AI Coach"
          description="Get personalized feedback, writing challenges, and grammar corrections."
        />
        <FeatureCard 
          icon={<ShieldCheck size={24} className="text-emerald-400" />}
          title="Streak Protection"
          description="Missed a day? Don't worry, your streak is protected automatically."
        />
        <FeatureCard 
          icon={<Library size={24} className="text-rose-400" />}
          title="Full Catalog Access"
          description="Explore all CEFR levels and specialized vocabulary categories."
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Ticket size={120} />
        </div>
        
        <h3 className="mb-2 text-xl font-bold text-white flex items-center gap-2">
          <Ticket size={20} className="text-blue-400" />
          Have a promo code?
        </h3>
        <p className="mb-6 text-[14px] text-white/50">
          Enter your code below to activate your PRO subscription instantly.
        </p>

        <form onSubmit={handleRedeem} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className="h-14 flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 text-lg font-bold text-white outline-none focus:border-amber-500/50 focus:bg-white/10 uppercase placeholder:text-white/20 transition-all"
            required
          />
          <button
            type="submit"
            disabled={loading || !promoCode.trim()}
            className="h-14 rounded-2xl bg-amber-500 px-8 text-[15px] font-bold text-black hover:bg-amber-400 transition-colors disabled:opacity-50 sm:w-auto w-full shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            {loading ? "Activating..." : "Activate PRO"}
          </button>
        </form>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex items-start gap-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
        {icon}
      </div>
      <div>
        <h4 className="mb-1 font-bold text-white">{title}</h4>
        <p className="text-[13px] leading-relaxed text-white/50">{description}</p>
      </div>
    </div>
  )
}

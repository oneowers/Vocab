"use client"
 
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ChevronRight, Languages, Sparkles, Trophy, AlertTriangle } from "lucide-react"
import { AppleHeader, AppleCard, AppleSpinner } from "@/components/AppleDashboardComponents"
 
interface TranslationChallengeViewProps {
  onBack: () => void
}
 
export function TranslationChallengeView({ onBack }: TranslationChallengeViewProps) {
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2" | null>(null)
  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [userTranslation, setUserTranslation] = useState("")
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)
 
  const handleStart = async (selectedLevel: "A1" | "A2" | "B1" | "B2") => {
    setLevel(selectedLevel)
    setLoading(true)
    setFeedback(null)
    setUserTranslation("")
    try {
      const response = await fetch("/api/practice/translation-challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cefrLevel: selectedLevel })
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setChallenge(data.challenge)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
 
  if (level && challenge) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <AppleHeader 
          title="Deep Translation" 
          onBack={() => {
            setLevel(null)
            setChallenge(null)
          }}
          sticky={true}
        />
 
        <div className="mx-auto w-full max-w-xl px-4 pt-24 pb-32">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <AppleSpinner />
            </div>
          ) : feedback ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <AppleCard>
                <div className="p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${feedback.score >= 80 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      <Trophy size={20} />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-black text-white">Result: {feedback.score}%</h3>
                      <p className="text-[13px] font-bold text-white/30">Translation Quality</p>
                    </div>
                  </div>
 
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white/[0.03] p-5 border border-white/[0.05]">
                      <p className="text-[15px] font-medium leading-relaxed text-white/60">
                        {feedback.feedbackRu}
                      </p>
                    </div>
 
                    <div className="space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/20">Optimal Version</p>
                      <p className="text-[17px] font-bold text-white leading-relaxed">
                        {feedback.optimalTranslation}
                      </p>
                    </div>
                  </div>
                </div>
              </AppleCard>
 
              <button
                onClick={() => handleStart(level)}
                className="w-full h-14 rounded-3xl bg-white text-black text-[17px] font-black hover:opacity-90 transition-all active:scale-[0.98] shadow-2xl"
              >
                Next Challenge
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <AppleCard>
                <div className="p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-black text-blue-400 border border-blue-500/20">
                      {level} Challenge
                    </span>
                    <Sparkles size={18} className="text-white/20" />
                  </div>
                  <p className="text-[22px] font-black leading-tight text-white tracking-tight">
                    {challenge.textRu}
                  </p>
                </div>
              </AppleCard>
 
              <AppleCard>
                <textarea
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  placeholder="Type your translation in English..."
                  className="w-full min-h-[160px] bg-transparent p-8 text-[18px] font-bold text-white placeholder:text-white/20 focus:outline-none resize-none"
                />
              </AppleCard>
 
              <button
                disabled={!userTranslation.trim() || checking}
                onClick={async () => {
                  setChecking(true)
                  try {
                    const res = await fetch("/api/practice/translation-challenge/check", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        cefrLevel: level,
                        originalTextRu: challenge.textRu,
                        userTranslationEn: userTranslation
                      })
                    })
                    const data = await res.json()
                    setFeedback(data.feedback)
                  } finally {
                    setChecking(false)
                  }
                }}
                className="w-full h-14 rounded-3xl bg-white text-black text-[17px] font-black disabled:opacity-30 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center"
              >
                {checking ? <AppleSpinner /> : "Check Translation"}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    )
  }
 
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <AppleHeader 
        title="Deep Translation" 
        onBack={onBack}
        sticky={true}
      />
 
      <div className="mx-auto w-full max-w-xl px-4 pt-24 pb-32">
        <header className="mb-10 px-1">
          <p className="text-[17px] font-bold text-white/40">Translate complex sentences with high-fidelity feedback</p>
        </header>
 
        <div className="grid grid-cols-2 gap-4">
          {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
            <AppleCard
              key={lvl}
              onClick={() => handleStart(lvl)}
            >
              <div className="p-6 text-center">
                <h3 className="text-[24px] font-black text-white">{lvl}</h3>
                <p className="text-[12px] font-black uppercase tracking-widest text-white/30 mt-1">Level</p>
              </div>
            </AppleCard>
          ))}
        </div>
      </div>
    </div>
  )
}

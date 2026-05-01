"use client"

import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface WritingChallengePageProps {
  task: {
    title: string
    prompt: string
    targetWords?: string[]
    targetGrammarTopics?: string[]
  } | null
  loading: boolean
  userText: string
  onUserTextChange: (text: string) => void
  onCheck: () => void
  checking: boolean
  onBack: () => void
}

export function WritingChallengePage({
  task,
  loading,
  userText,
  onUserTextChange,
  onCheck,
  checking,
  onBack
}: WritingChallengePageProps) {
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false)
  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0c10]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#0a0c10]/80 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/5"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-[15px] font-bold text-white">
            {loading ? "Generating..." : task?.title || "Writing Task"}
          </h2>
          {task?.targetGrammarTopics?.[0] && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              {task.targetGrammarTopics[0].replaceAll("_", " ")}
            </span>
          )}
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 size={32} className="animate-spin text-purple-500" />
            <p className="text-[14px] text-white/40">Preparing your challenge...</p>
          </div>
        ) : (
          <div className="mx-auto max-w-xl space-y-6 pb-32">
            {/* Task Prompt Card */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <button
                onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-[12px] font-extrabold uppercase tracking-widest text-white/30">
                  Task Prompt
                </span>
                {isPromptCollapsed ? <ChevronDown size={18} className="text-white/30" /> : <ChevronUp size={18} className="text-white/30" />}
              </button>
              
              <AnimatePresence initial={false}>
                {!isPromptCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-[16px] leading-relaxed text-white/80 font-medium">
                        {task?.prompt}
                      </p>
                      
                      {task?.targetWords && task.targetWords.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {task.targetWords.map(word => {
                            const isUsed = userText.toLowerCase().includes(word.toLowerCase())
                            return (
                              <span 
                                key={word}
                                className={`rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-all ${
                                  isUsed 
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]" 
                                    : "border-white/10 bg-white/5 text-white/40"
                                }`}
                              >
                                {word}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Writing Area */}
            <div className="relative">
              <textarea
                value={userText}
                onChange={(e) => onUserTextChange(e.target.value)}
                placeholder="Write your answer here (minimum 30 words)..."
                className="min-h-[450px] w-full resize-none bg-transparent text-[18px] leading-relaxed text-white placeholder:text-white/10 focus:outline-none selection:bg-purple-500/30"
                autoFocus
              />
            </div>
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      {!loading && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-[#0a0c10]/80 p-5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className={`text-[14px] font-black ${wordCount < 30 ? "text-white/40" : "text-emerald-400"}`}>
                {wordCount} / 30 words
              </span>
              {wordCount < 30 && (
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Need {30 - wordCount} more</span>
              )}
            </div>
            
            <button
              disabled={wordCount < 30 || checking}
              onClick={onCheck}
              className={`flex h-14 items-center gap-2 rounded-2xl px-10 text-[16px] font-black transition-all active:scale-[0.98] shadow-2xl ${
                wordCount < 30 || checking
                  ? "bg-white/5 text-white/20 border border-white/5"
                  : "bg-white text-black hover:bg-white/90 shadow-white/10"
              }`}
            >
              {checking ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Check Grammar
                  <Sparkles size={18} />
                </>
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

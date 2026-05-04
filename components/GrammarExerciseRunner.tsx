"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, X } from "lucide-react"
import type { GrammarTopicContent } from "@/lib/grammar-content"
import { 
  MultipleChoiceView, 
  FillBlankView, 
  FixMistakeView, 
  SentenceBuilderView 
} from "./GrammarExerciseViews"
import { GrammarWritingExerciseView } from "./GrammarWritingExerciseView"

interface GrammarExerciseRunnerProps {
  topic: GrammarTopicContent
  onComplete: (scoreGained: number) => void
  onBack: () => void
  appSettings: any
}

export function GrammarExerciseRunner({ topic, onComplete, onBack, appSettings }: GrammarExerciseRunnerProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [canGoNext, setCanGoNext] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionId] = useState(() => `session_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`)
  const exercises = topic.exercises || []
  const currentEx = exercises[currentIdx]
  
  const progress = ((currentIdx + 1) / exercises.length) * 100

  const handleAnswer = async (isCorrect: boolean, scoreDelta: number) => {
    setSessionScore(prev => prev + scoreDelta)
    setCanGoNext(true)
    
    // Call API to update progress in real-time
    try {
      await fetch("/api/practice/grammar-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicKey: topic.key,
          scoreDelta,
          exerciseId: currentEx.id,
          isCorrect,
          sessionId
        })
      })
    } catch (e) {
      console.error("Failed to sync progress")
    }
  }

  const handleNext = () => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setCanGoNext(false)
    } else {
      onComplete(sessionScore)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0c10]">
      {/* Header with Progress Bar */}
      <header className="sticky top-0 z-30 space-y-4 border-b border-white/5 bg-[#0a0c10]/80 px-4 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="text-[12px] font-black uppercase tracking-widest text-white/30">
            {currentIdx + 1} of {exercises.length}
          </div>
          <div className="w-6" />
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-300"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEx.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentEx.type === "multiple_choice" && (
                <MultipleChoiceView exercise={currentEx} onAnswer={handleAnswer} appSettings={appSettings} />
              )}
              {currentEx.type === "fill_blank" && (
                <FillBlankView exercise={currentEx} onAnswer={handleAnswer} appSettings={appSettings} />
              )}
              {currentEx.type === "fix_mistake" && (
                <FixMistakeView exercise={currentEx} onAnswer={handleAnswer} appSettings={appSettings} />
              )}
              {currentEx.type === "sentence_builder" && (
                <SentenceBuilderView exercise={currentEx} onAnswer={handleAnswer} appSettings={appSettings} />
              )}
              {currentEx.type === "writing" && (
                <GrammarWritingExerciseView 
                  exercise={currentEx} 
                  onComplete={(delta) => {
                    handleAnswer(true, delta)
                    onComplete(sessionScore + delta)
                  }} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      {canGoNext && currentEx.type !== "writing" && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-[#0a0c10]/90 p-5 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-xl">
            <button
              onClick={handleNext}
              className="h-14 w-full rounded-2xl bg-white text-black text-[16px] font-black hover:bg-white/90 transition-all active:scale-[0.98]"
            >
              {currentIdx === exercises.length - 1 ? "Finish Lesson" : "Continue"}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

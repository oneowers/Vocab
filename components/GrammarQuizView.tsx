"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle2, XCircle, Zap } from "lucide-react"
import { AppleHeader, AppleCard } from "@/components/AppleDashboardComponents"

interface GrammarQuizViewProps {
  onBack: () => void
}

const MOCK_QUESTIONS = [
  {
    id: "1",
    question: "Which sentence is grammatically correct?",
    options: [
      "I have been to London last year.",
      "I went to London last year.",
      "I was went to London last year.",
      "I have gone to London last year."
    ],
    correct: 1,
    explanation: "We use Past Simple (went) for finished actions in the past with a specific time expression (last year)."
  },
  {
    id: "2",
    question: "Choose the correct form: 'If I ___ you, I would study harder.'",
    options: ["am", "was", "were", "be"],
    correct: 2,
    explanation: "In second conditional sentences, we use 'were' for all persons in the if-clause."
  },
  {
    id: "3",
    question: "Identify the correct preposition: 'He is interested ___ learning Russian.'",
    options: ["on", "at", "in", "with"],
    correct: 2,
    explanation: "The adjective 'interested' is always followed by the preposition 'in'."
  }
]

export function GrammarQuizView({ onBack }: GrammarQuizViewProps) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = MOCK_QUESTIONS[index]

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === current.correct
    setIsCorrect(correct)
    if (correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (index + 1 < MOCK_QUESTIONS.length) {
      setIndex(index + 1)
      setSelected(null)
      setIsCorrect(null)
    } else {
      setFinished(true)
    }
  }

  if (finished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-8 text-center relative overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-10 flex h-24 w-24 items-center justify-center rounded-[32px] bg-white/[0.05] text-white border border-white/[0.1] shadow-2xl relative z-10"
        >
          <CheckCircle2 size={48} strokeWidth={3} className="text-emerald-400" />
        </motion.div>
        
        <h1 className="text-[34px] font-black text-white tracking-tighter relative z-10 leading-tight">Quiz Complete!</h1>
        
        <p className="mt-10 text-[17px] text-white/40 leading-relaxed max-w-[280px] font-medium relative z-10">
          You scored <span className="text-white/80 font-bold">{score} out of {MOCK_QUESTIONS.length}</span>.
        </p>
 
        <button
          onClick={onBack}
          className="mt-16 w-full max-w-xs h-14 rounded-3xl bg-white text-black text-[17px] font-black hover:opacity-90 transition-all active:scale-[0.98] shadow-2xl relative z-10"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <AppleHeader 
        title="Quick Quiz" 
        onBack={onBack}
        sticky={true}
      />
 
      <div className="mx-auto max-w-xl px-4 pt-24 pb-32">
        <div className="flex items-center justify-between mb-8 px-1">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-white/20">Question {index + 1} of {MOCK_QUESTIONS.length}</span>
          <div className="h-1.5 w-32 rounded-full bg-white/5 overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${((index + 1) / MOCK_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
 
        <div className="space-y-6">
          <AppleCard>
            <div className="p-8">
              <h3 className="text-[22px] font-black leading-tight text-white tracking-tight">{current.question}</h3>
            </div>
          </AppleCard>

        <div className="grid gap-3">
          {current.options.map((option, i) => {
            const isSelected = selected === i
            const isCorrectOption = i === current.correct
            let borderStyle = "border-white/5"
            let bgStyle = "bg-white/[0.03]"
            
            if (selected !== null) {
              if (isCorrectOption) {
                borderStyle = "border-emerald-500/40"
                bgStyle = "bg-emerald-500/10"
              } else if (isSelected) {
                borderStyle = "border-rose-500/40"
                bgStyle = "bg-rose-500/10"
              }
            }

            return (
              <button
                key={i}
                disabled={selected !== null}
                onClick={() => handleSelect(i)}
                className={`flex items-center justify-between rounded-[1.5rem] border p-5 text-left transition-all ${borderStyle} ${bgStyle} ${selected === null ? "hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.98]" : ""}`}
              >
                <span className={`text-[17px] font-bold ${isSelected || (selected !== null && isCorrectOption) ? "text-white" : "text-white/60"}`}>
                  {option}
                </span>
                {selected !== null && (
                  <span>
                    {isCorrectOption ? <CheckCircle2 size={20} className="text-emerald-400" /> : isSelected ? <XCircle size={20} className="text-rose-400" /> : null}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <AnimatePresence>
          {selected !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <div className="rounded-2xl bg-white/[0.02] p-6 border border-white/5 mb-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-2">Explanation</p>
                <p className="text-[15px] font-medium leading-relaxed text-white/70">{current.explanation}</p>
              </div>
              <button
                onClick={handleNext}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 text-[15px] font-black uppercase tracking-widest text-white shadow-[0_10px_20px_rgba(59,130,246,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {index + 1 < MOCK_QUESTIONS.length ? "Next Question" : "Finish Quiz"}
                <Zap size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  )
}

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle2, XCircle, Zap } from "lucide-react"

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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-white">Quiz Complete!</h2>
        <p className="mt-2 text-white/40">You scored {score} out of {MOCK_QUESTIONS.length}</p>
        <button
          onClick={onBack}
          className="mt-8 h-14 rounded-2xl bg-white px-8 text-[15px] font-black uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-8 flex items-center justify-between">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-black text-white/20 uppercase tracking-widest">Question</span>
          <span className="text-[15px] font-black text-white">{index + 1}/{MOCK_QUESTIONS.length}</span>
        </div>
      </header>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/5 bg-white/[0.03] p-8 shadow-xl">
          <h3 className="text-[22px] font-black leading-tight text-white">{current.question}</h3>
        </div>

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
  )
}

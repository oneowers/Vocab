"use client"

import { Check, Loader2, Sparkles, X } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { 
  GrammarExercise, 
  MultipleChoiceExercise, 
  FillBlankExercise, 
  FixMistakeExercise, 
  SentenceBuilderExercise, 
  WritingExercise 
} from "@/lib/grammar-content"

interface ExerciseViewProps {
  exercise: GrammarExercise
  onAnswer: (isCorrect: boolean, scoreDelta: number) => void
  onWritingComplete?: (feedback: any) => void
}

export function MultipleChoiceView({ exercise, onAnswer }: { exercise: MultipleChoiceExercise; onAnswer: (isCorrect: boolean, scoreDelta: number) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (id: string, isCorrect: boolean) => {
    if (selectedId) return
    setSelectedId(id)
    onAnswer(isCorrect, isCorrect ? 2 : -2)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-[18px] font-bold text-white">{exercise.question}</h3>
      <div className="grid gap-3">
        {exercise.options.map(opt => {
          const isSelected = selectedId === opt.id
          const answered = selectedId !== null
          
          let cls = "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
          if (answered) {
            if (opt.isCorrect) cls = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            else if (isSelected) cls = "border-rose-500/30 bg-rose-500/10 text-rose-400"
            else cls = "border-white/5 bg-white/[0.01] text-white/20 opacity-40"
          }

          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt.id, opt.isCorrect)}
              className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all ${cls}`}
            >
              <span className="text-[16px] font-bold">{opt.text}</span>
              {answered && opt.isCorrect && <Check size={18} />}
              {answered && isSelected && !opt.isCorrect && <X size={18} />}
            </button>
          )
        })}
      </div>
      
      {selectedId && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/5 p-5 border border-white/10">
          <p className="text-[14px] leading-relaxed text-white/70">
            {exercise.options.find(o => o.id === selectedId)?.feedbackRu}
          </p>
        </motion.div>
      )}
    </div>
  )
}

export function FillBlankView({ exercise, onAnswer }: { exercise: FillBlankExercise; onAnswer: (isCorrect: boolean, scoreDelta: number) => void }) {
  const [value, setValue] = useState("")
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSubmit = () => {
    if (answered || !value.trim()) return
    const correct = exercise.correctAnswers.some(a => a.toLowerCase() === value.trim().toLowerCase())
    setIsCorrect(correct)
    setAnswered(true)
    onAnswer(correct, correct ? 2 : -2)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h3 className="text-[20px] font-bold text-white leading-relaxed">
          {exercise.sentence.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <input
                  type="text"
                  value={value}
                  disabled={answered}
                  onChange={e => setValue(e.target.value)}
                  className={`mx-2 h-10 w-32 rounded-xl border-b-2 bg-white/5 px-3 text-center text-[18px] font-black outline-none transition-all ${
                    answered 
                      ? isCorrect 
                        ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" 
                        : "border-rose-500 text-rose-400 bg-rose-500/10"
                      : "border-white/20 focus:border-white focus:bg-white/10"
                  }`}
                  autoFocus
                />
              )}
            </span>
          ))}
        </h3>
      </div>

      {!answered && (
        <button
          onClick={handleSubmit}
          className="h-14 w-full rounded-2xl bg-white text-black text-[16px] font-black hover:bg-white/90 transition-all active:scale-[0.98]"
        >
          Check Answer
        </button>
      )}

      {answered && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/5 p-5 border border-white/10">
          <p className="text-[14px] leading-relaxed text-white/70">
            {isCorrect ? "Correct! Well done." : `Correct answer: ${exercise.correctAnswers[0]}`}
            <br />
            {exercise.feedbackRu}
          </p>
        </motion.div>
      )}
    </div>
  )
}

export function FixMistakeView({ exercise, onAnswer }: { exercise: FixMistakeExercise; onAnswer: (isCorrect: boolean, scoreDelta: number) => void }) {
  const [value, setValue] = useState("")
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSubmit = () => {
    if (answered || !value.trim()) return
    const correct = value.trim().toLowerCase() === exercise.correctSentence.toLowerCase()
    setIsCorrect(correct)
    setAnswered(true)
    onAnswer(correct, correct ? 2 : -2)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-2 block">Wrong Sentence</span>
        <p className="text-[18px] font-bold text-rose-300/80 line-through decoration-rose-500/30">
          {exercise.wrongSentence}
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-4">Correct Version</span>
        <textarea
          value={value}
          disabled={answered}
          onChange={e => setValue(e.target.value)}
          placeholder="Type the correct sentence..."
          className={`h-32 w-full resize-none rounded-3xl border p-6 text-[17px] font-bold outline-none transition-all ${
            answered 
              ? isCorrect 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              : "border-white/10 bg-white/5 focus:border-white/30"
          }`}
          autoFocus
        />
      </div>

      {!answered && (
        <button
          onClick={handleSubmit}
          className="h-14 w-full rounded-2xl bg-white text-black text-[16px] font-black hover:bg-white/90 transition-all active:scale-[0.98]"
        >
          Check Sentence
        </button>
      )}

      {answered && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/5 p-5 border border-white/10">
          <p className="font-bold text-white mb-2">{isCorrect ? "Spot on!" : "Not exactly."}</p>
          {!isCorrect && <p className="text-emerald-400 font-bold mb-2">{exercise.correctSentence}</p>}
          <p className="text-[14px] leading-relaxed text-white/70">
            {exercise.explanationRu}
          </p>
        </motion.div>
      )}
    </div>
  )
}

export function SentenceBuilderView({ exercise, onAnswer }: { exercise: SentenceBuilderExercise; onAnswer: (isCorrect: boolean, scoreDelta: number) => void }) {
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const toggleWord = (word: string, index: number) => {
    if (answered) return
    const key = `${word}-${index}`
    if (selectedWords.includes(key)) {
      setSelectedWords(prev => prev.filter(w => w !== key))
    } else {
      setSelectedWords(prev => [...prev, key])
    }
  }

  const handleSubmit = () => {
    if (answered || selectedWords.length === 0) return
    const builded = selectedWords.map(w => w.split("-")[0]).join(" ")
    // Allow for some minor punctuation differences if needed, but here exact match
    const correct = builded.toLowerCase().replace(/[.!?]/g, "") === exercise.correctSentence.toLowerCase().replace(/[.!?]/g, "")
    setIsCorrect(correct)
    setAnswered(true)
    onAnswer(correct, correct ? 2 : -2)
  }

  return (
    <div className="space-y-8">
      <div className="min-h-[120px] rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-wrap gap-2 content-start">
        {selectedWords.map((wordKey, i) => (
          <button
            key={i}
            onClick={() => setSelectedWords(prev => prev.filter((_, idx) => idx !== i))}
            disabled={answered}
            className={`rounded-xl px-4 py-2 text-[16px] font-bold transition-all ${
              answered 
                ? isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                : "bg-white/10 text-white"
            }`}
          >
            {wordKey.split("-")[0]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {exercise.words.map((word, i) => {
          const isSelected = selectedWords.includes(`${word}-${i}`)
          return (
            <button
              key={i}
              onClick={() => toggleWord(word, i)}
              disabled={answered || isSelected}
              className={`rounded-2xl border px-5 py-3 text-[15px] font-bold transition-all ${
                isSelected 
                  ? "border-transparent bg-white/5 text-transparent" 
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {word}
            </button>
          )
        })}
      </div>

      {!answered && (
        <button
          onClick={handleSubmit}
          className="h-14 w-full rounded-2xl bg-white text-black text-[16px] font-black hover:bg-white/90 transition-all active:scale-[0.98]"
        >
          Check Sentence
        </button>
      )}

      {answered && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/5 p-5 border border-white/10">
          {!isCorrect && (
            <p className="text-emerald-400 font-bold mb-2">{exercise.correctSentence}</p>
          )}
          <p className="text-[14px] leading-relaxed text-white/70">
            {exercise.explanationRu}
          </p>
        </motion.div>
      )}
    </div>
  )
}

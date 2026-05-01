"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight, ArrowUp, BookOpenText, Brain, CheckCircle2,
  ChevronRight, Clock, Languages, Layers, LayoutGrid,
  Loader2, MessageCircle, PenLine, Sparkles, Target,
  Theater, UserRound, XCircle, AlertCircle, type LucideIcon
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

import { ProUpgradeBanner } from "@/components/ProUpgradeBanner"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { getTodayDateKey, isDueDate } from "@/lib/date"
import { getGuestCards, isGuestSessionActive } from "@/lib/guest"
import { sortDueCards } from "@/lib/spaced-repetition"
import type { CardsResponse } from "@/lib/types"
import {
  parseAIBlockFromText,
  looksLikeAIBlock,
  type ChatMessage,
  type QuizBlock,
  type WordListBlock,
  type AIBlock
} from "@/lib/ai-blocks"

// ─── Types ────────────────────────────────────────────────────────────────────

type AiModeId = "chat" | "prompts" | "story" | "quiz" | "memory" | "roleplay" | "review"

interface AiMode { id: AiModeId; label: string; icon: LucideIcon }
const aiModes: AiMode[] = [
  { id: "chat",     label: "Chat",     icon: MessageCircle },
  { id: "prompts",  label: "Prompts",  icon: Sparkles },
  { id: "story",    label: "Story",    icon: BookOpenText },
  { id: "quiz",     label: "Quiz",     icon: Target },
  { id: "memory",   label: "Memory",   icon: Brain },
  { id: "roleplay", label: "Roleplay", icon: Theater },
  { id: "review",   label: "Review",   icon: PenLine },
]
 
interface AiChatApiResponse {
  reply?: string | null
  kind?: "text" | "block" | "error"
  block?: AIBlock
  mode?: string
  source?: string | null
}

// ─── QuizCard ─────────────────────────────────────────────────────────────────

// ─── WordListCard ──────────────────────────────────────────────────────────────

function WordListCard({ block }: { block: WordListBlock }) {
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [allSaved, setAllSaved] = useState(false)
  const [savingAll, setSavingAll] = useState(false)

  async function saveWord(word: string, translation: string) {
    if (saved.has(word) || saving.has(word)) return
    setSaving(prev => new Set(prev).add(word))
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: word, translation, direction: "en-ru" })
      })
      if (res.ok) {
        setSaved(prev => new Set(prev).add(word))
      }
    } finally {
      setSaving(prev => { const next = new Set(prev); next.delete(word); return next })
    }
  }

  async function saveAll() {
    setSavingAll(true)
    const unsaved = block.items.filter(w => !saved.has(w.word))
    await Promise.allSettled(unsaved.map(w => saveWord(w.word, w.translation)))
    setAllSaved(true)
    setSavingAll(false)
  }

  const savedCount = saved.size
  const total = block.items.length

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,#0f1117,#0a0c12)] p-4 shadow-2xl md:p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              <Layers size={13} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Topic Dictionary</span>
          </div>
          <h2 className="text-[18px] font-black text-white leading-tight">{block.topic}</h2>
          {block.description && (
            <p className="mt-1 text-[12px] text-white/40 leading-relaxed">{block.description}</p>
          )}
        </div>
        <button
          onClick={saveAll}
          disabled={savingAll || allSaved}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition-all ${
            allSaved
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-white text-black active:scale-95 hover:bg-white/90"
          }`}
        >
          {savingAll ? (
            <><Loader2 size={11} className="animate-spin" /> Saving...</>
          ) : allSaved ? (
            <><CheckCircle2 size={11} /> All saved!</>
          ) : (
            <><ArrowRight size={11} /> Save all ({total - savedCount})</>
          )}
        </button>
      </div>

      {/* Word list */}
      <div className="space-y-1.5">
        {block.items.map((item) => {
          const isSaved = saved.has(item.word)
          const isSaving = saving.has(item.word)
          return (
            <div
              key={item.word}
              className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all ${
                isSaved ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] font-bold ${ isSaved ? "text-emerald-300" : "text-white"}`}>{item.word}</span>
                  {item.level && (
                    <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/30">
                      {item.level}
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-white/50">{item.translation}</span>
                {item.example && (
                  <p className="mt-0.5 text-[11px] italic text-white/30 truncate">{item.example}</p>
                )}
              </div>
              <button
                onClick={() => saveWord(item.word, item.translation)}
                disabled={isSaved || isSaving}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                  isSaved
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white active:scale-95"
                }`}
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : isSaved ? <CheckCircle2 size={12} /> : <ArrowRight size={12} />}
              </button>
            </div>
          )
        })}
      </div>

      {savedCount > 0 && (
        <p className="mt-3 text-center text-[11px] text-white/30">
          {savedCount} of {total} words added to your deck
        </p>
      )}
    </div>
  )
}

function QuizCard({ quiz }: { quiz: QuizBlock }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const items = quiz.items ?? []
  const item = items[idx]

  if (!item) return (
    <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
      <AlertCircle className="mx-auto mb-2 text-rose-400" size={24} />
      <p className="text-[14px] font-bold text-rose-200">Quiz data is incomplete. Please generate again.</p>
    </div>
  )

  const isLast = idx === items.length - 1
  const selectedOpt = item.options.find(o => o.id === selected)
  const correctOpt  = item.options.find(o => o.isCorrect)

  const handleSelect = (id: string) => {
    if (selected) return
    const opt = item.options.find(o => o.id === id)
    if (opt?.isCorrect) setScore(s => s + 1)
    setSelected(id)
  }

  const handleNext = () => {
    if (isLast) { setDone(true); return }
    setSelected(null)
    setIdx(i => i + 1)
  }

  if (done) return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,#1a1a20,#121217)] p-6 text-center shadow-2xl">
      <div className="mb-3 flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 size={24} />
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-amber-400/70 mb-1">Quiz Complete</p>
      <p className="text-[24px] font-black text-white">You scored {score} / {items.length}</p>
      <p className="mt-1 text-[13px] text-white/40">
        {score === items.length ? "Perfect score! 🎉" : score >= items.length / 2 ? "Good job! Keep practising." : "Keep going, you'll get there!"}
      </p>
    </div>
  )

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,#1a1a20,#121217)] p-4 shadow-2xl md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
            <Target size={13} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{quiz.title}</span>
        </div>
        <span className="text-[10px] font-black text-white/30">{idx + 1} / {items.length}</span>
      </div>

      {/* Word */}
      <div className="mb-4 text-center">
        <h2 className="text-[26px] font-black text-white leading-tight">{item.word}</h2>
        {item.level && (
          <span className="mt-1 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/40">
            {item.level}
          </span>
        )}
      </div>

      <p className="mb-4 text-center text-[13px] font-bold text-white/60">{item.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {item.options.map(opt => {
          const text = opt.text
          if (!text) return null
          const isCorrect  = opt.isCorrect
          const isSelected = selected === opt.id
          const answered   = selected !== null

          let cls = "border-white/5 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
          if (answered) {
            if (isCorrect)             cls = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            else if (isSelected)       cls = "border-rose-500/30 bg-rose-500/10 text-rose-400"
            else                       cls = "border-white/5 bg-white/[0.01] text-white/10 opacity-30"
          }

          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => handleSelect(opt.id)}
              className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[1.1rem] border px-4 py-3 text-left transition-all duration-200 ${cls}`}
            >
              <span className="text-[13px] font-bold">{text}</span>
              {answered && isCorrect  && <CheckCircle2 size={15} className="shrink-0" />}
              {answered && isSelected && !isCorrect && <XCircle size={15} className="shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* Feedback + Next */}
      <AnimatePresence>
        {selected && selectedOpt && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            <div className={`rounded-2xl border p-4 ${selectedOpt.isCorrect ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-100/80" : "bg-rose-500/5 border-rose-500/10 text-rose-100/80"}`}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">
                {selectedOpt.isCorrect ? "Correct" : "Not quite"}
              </p>
              <p className="text-[13px] font-medium leading-relaxed">{selectedOpt.feedback}</p>
              {!selectedOpt.isCorrect && correctOpt && (
                <p className="mt-2 text-[12px] font-bold text-emerald-400/70">
                  Correct answer: {correctOpt.text}
                </p>
              )}
            </div>
            <button
              onClick={handleNext}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-black text-[13px] font-black transition active:scale-[0.98]"
            >
              {isLast ? "Finish Quiz" : "Next Question"}
              <ArrowRight size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Message Renderer ─────────────────────────────────────────────────────────

function AiMessage({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-[1.75rem] bg-white px-5 py-3.5 text-[14px] font-semibold text-black shadow-xl">
          {msg.content}
        </div>
      </div>
    )
  }

  if (msg.kind === "block" && msg.block.type === "quiz") {
    return <QuizCard quiz={msg.block} />
  }

  if (msg.kind === "block" && msg.block.type === "word_list") {
    return <WordListCard block={msg.block} />
  }

  if (msg.kind === "error") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[88%] rounded-[1.75rem] border border-rose-500/20 bg-rose-500/5 px-5 py-3.5 text-[14px] text-rose-200">
          {msg.content}
        </div>
      </div>
    )
  }

  // Text message — could be plain text or contain a legacy embedded block
  const content = msg.kind === "text" ? msg.content : (msg as any).content ?? ""

  // Safety fallback: if text looks like a block, try to parse it
  if (looksLikeAIBlock(content)) {
    const result = parseAIBlockFromText(content)
    if (result.ok && result.block.type === "quiz") {
      return <QuizCard quiz={result.block} />
    }
    if (!result.ok) {
      return (
        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-[1.75rem] border border-white/5 bg-[#121217] px-5 py-3.5 text-[14px] text-rose-300/80">
            Quiz data is incomplete. Please regenerate.
          </div>
        </div>
      )
    }
  }

  return (
    <div className="flex justify-start">
      <div className="w-full rounded-[1.75rem] border border-white/5 bg-[#121217] px-5 py-3.5 text-[14px] leading-relaxed text-white/90 shadow-xl md:px-6 md:py-4 md:text-[15px]">
        <ReactMarkdown
          components={{
            strong: ({ children }) => <strong className="font-black text-amber-400 bg-amber-400/10 px-1 rounded-md mx-0.5">{children}</strong>,
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-3 mt-2 list-disc pl-5 space-y-1 text-white/70">{children}</ul>,
            ol: ({ children }) => <ol className="mb-3 mt-2 list-decimal pl-5 space-y-1 text-white/70">{children}</ol>,
            li: ({ children }) => <li className="pl-1">{children}</li>,
            em: ({ children }) => <em className="italic text-white/60">{children}</em>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export { QuizCard, WordListCard, AiMessage }

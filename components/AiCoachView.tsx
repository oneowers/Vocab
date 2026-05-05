"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowUp, BookOpenText, Brain, ChevronRight, Clock,
  Languages, Layers, LayoutGrid, Loader2, MessageCircle,
  PenLine, Sparkles, Target, Theater, UserRound, type LucideIcon
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

import { ProUpgradeBanner } from "@/components/ProUpgradeBanner"
import { AIRecommendationSkeleton } from "@/components/ai/AIRecommendationSkeleton"
import { useToast } from "@/components/Toast"
import { AiMessage } from "@/components/AiCoachComponents"
import { useClientResource } from "@/hooks/useClientResource"
import { getTodayDateKey, isDueDate } from "@/lib/date"
import { getGuestCards, isGuestSessionActive } from "@/lib/guest"
import { sortDueCards } from "@/lib/spaced-repetition"
import type { CardsResponse } from "@/lib/types"
import type { ChatMessage, AIBlock } from "@/lib/ai-blocks"

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

interface SuggestedAction {
  id: string; title: string; description: string
  icon: LucideIcon; color: string
  visibleMessage: string; mode: AiModeId
}

const SUGGESTED_ACTIONS: SuggestedAction[] = [
  { id: "explain",   title: "Explain due words",  description: "Get context for today's words",  icon: BookOpenText, color: "text-blue-400",    visibleMessage: "Can you explain my words for today?",       mode: "chat" },
  { id: "practice",  title: "Practice unknown",   description: "Focus on words you missed",      icon: Target,       color: "text-rose-400",    visibleMessage: "Help me practise my difficult words.",       mode: "memory" },
  { id: "plan",      title: "Study plan",         description: "Personalised learning path",     icon: Sparkles,     color: "text-amber-400",   visibleMessage: "Create a study plan for my current deck.",  mode: "chat" },
  { id: "quiz",      title: "Quiz me",            description: "Interactive word practice",      icon: LayoutGrid,   color: "text-emerald-400", visibleMessage: "Quiz me on my saved words.",                mode: "quiz" },
  { id: "sentences", title: "Make examples",      description: "Build context from active cards", icon: PenLine,     color: "text-indigo-400",  visibleMessage: "Write a short story using my words.",       mode: "story" },
]

interface ApiResponse {
  reply?: string | null
  kind?: "text" | "block" | "error"
  block?: AIBlock
  mode?: string
}

function mkId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}` }
function mkNow() { return new Date().toISOString() }

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Badge({ icon: Icon, label, loading }: { icon: LucideIcon; label: string; loading?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-bg-tertiary px-2.5 py-1 text-[10px] font-bold text-muted backdrop-blur-md">
      <Icon size={10} className="text-quiet" />
      {loading ? <div className="h-2 w-6 animate-pulse rounded bg-line" /> : label}
    </div>
  )
}

function DeckBadges({ total, due, level, loading }: { total: number; due: number; level: string; loading: boolean }) {
  return (
    <div className="hide-scrollbar mt-4 flex w-full items-center gap-1.5 overflow-x-auto px-1 md:justify-center md:gap-2">
      <Badge icon={Layers}    label={`${total} cards`} loading={loading} />
      <Badge icon={Clock}     label={`${due} due`}     loading={loading} />
      <Badge icon={Target}    label={`${level}`}       loading={loading} />
      <Badge icon={Languages} label="EN → RU" />
    </div>
  )
}

function ActionCard({ action, onClick }: { action: SuggestedAction; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 rounded-[22px] border border-line bg-bg-secondary/40 p-3.5 text-left transition-all hover:bg-bg-tertiary active:scale-[0.98] md:flex-col md:items-start md:rounded-3xl md:p-5 backdrop-blur-sm shadow-sm"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-tertiary ${action.color} md:h-11 md:w-11 md:rounded-2xl`}>
        <action.icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[14px] font-bold text-ink">{action.title}</p>
        <p className="truncate text-[12px] text-muted md:whitespace-normal md:mt-1">{action.description}</p>
      </div>
      <ChevronRight size={16} className="text-quiet md:hidden" />
    </button>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function AiCoachView({ isPro }: { isPro: boolean }) {
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome", role: "assistant", kind: "text", createdAt: mkNow(),
    content: "I'm your AI study coach. Ask for explanations, examples, CEFR feedback, or quiz yourself on saved words."
  }])
  const [input, setInput]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [activeMode, setMode]   = useState<AiModeId>("chat")
  const [guestMode, setGuest]   = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const { data: cardsPayload, loading: cardsLoading } = useClientResource<CardsResponse>({
    key: "cards:collection",
    enabled: isPro && !guestMode,
    staleTimeMs: 60_000,
    revalidateOnMount: true,
    loader: async () => {
      const r = await fetch("/api/cards")
      if (!r.ok) throw new Error("Could not load cards.")
      return r.json() as Promise<CardsResponse>
    },
    onError: () => showToast("Could not connect AI to your deck.", "error")
  })

  const deckCards = useMemo(() => {
    if (guestMode) return sortDueCards(getGuestCards())
    return sortDueCards(cardsPayload?.cards ?? [])
  }, [cardsPayload?.cards, guestMode])

  const todayKey   = getTodayDateKey()
  const dueCount   = deckCards.filter(c => isDueDate(c.nextReviewDate, todayKey)).length
  const level      = cardsPayload?.dailyCatalog.cefrLevel ?? "B1"

  useEffect(() => { setGuest(isGuestSessionActive()) }, [])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])
  useEffect(() => {
    const t = inputRef.current
    if (!t) return
    t.style.height = "auto"
    t.style.height = `${Math.min(t.scrollHeight, 120)}px`
  }, [input])

  async function sendMessage(visibleText: string, overrideMode?: AiModeId) {
    const text = visibleText.trim()
    if (!text || loading) return

    const mode = overrideMode ?? activeMode

    // Guard: quiz needs cards
    if (mode === "quiz" && deckCards.length === 0) {
      showToast("No saved words found. Add some cards first!", "error")
      return
    }

    const userMsg: ChatMessage = { id: mkId(), role: "user", kind: "text", content: text, createdAt: mkNow() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.kind === "block" ? "[quiz block]" : (m as any).content ?? ""
          }))
        })
      })

      if (!res.ok) throw new Error("AI coach is temporarily resting. Try again soon.")
      const payload = (await res.json()) as ApiResponse

      let assistantMsg: ChatMessage

      if (payload.kind === "block" && payload.block) {
        assistantMsg = { id: mkId(), role: "assistant", kind: "block", block: payload.block, createdAt: mkNow() }
      } else if (payload.kind === "error") {
        assistantMsg = { id: mkId(), role: "assistant", kind: "error", content: payload.reply ?? "Something went wrong.", createdAt: mkNow() }
      } else {
        assistantMsg = { id: mkId(), role: "assistant", kind: "text", content: payload.reply ?? "No response.", createdAt: mkNow() }
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed"
      showToast(msg, "error")
      setMessages(prev => [...prev, {
        id: mkId(), role: "assistant", kind: "error", createdAt: mkNow(),
        content: `⚠️ ${msg}\n\nPlease try again in a few seconds.`
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!isPro) return <ProUpgradeBanner />

  const isEmpty = messages.length <= 1

  return (
    <div className="relative min-h-screen bg-bg-primary pb-32 pt-20 text-ink md:pb-40 md:pt-28 transition-colors duration-300">
      {/* Top Nav */}
      <div className="fixed inset-x-0 top-0 z-[60] flex justify-center px-3 py-3 md:px-4 md:py-5">
        <div className="flex w-full max-w-2xl items-center gap-2">
          <div className="hide-scrollbar flex flex-1 items-center gap-1 overflow-x-auto rounded-full border border-line bg-bg-secondary/80 p-1 backdrop-blur-2xl shadow-modal">
            {aiModes.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition-all ${
                  activeMode === m.id ? "bg-ink text-bg-primary" : "text-muted hover:text-ink hover:bg-bg-tertiary"
                }`}
              >
                <m.icon size={13} />
                {m.label}
              </button>
            ))}
          </div>
          <Link href="/profile" className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-line bg-bg-secondary/80 text-muted backdrop-blur-2xl transition hover:text-ink shadow-modal">
            <UserRound size={18} />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div key="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-4 text-center md:py-10"
            >
              {cardsLoading && !cardsPayload && !guestMode ? (
                <AIRecommendationSkeleton />
              ) : (
                <>
                  <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-amber-400 to-orange-600 p-[1px] md:h-20 md:w-20 md:rounded-3xl shadow-lg shadow-orange-500/20">
                    <div className="flex h-full w-full items-center justify-center rounded-[19px] bg-bg-secondary md:rounded-[1.4rem]">
                      <Sparkles size={24} className="text-amber-400 md:size-8" />
                    </div>
                  </div>
                  <h1 className="max-w-[280px] text-[20px] font-black leading-tight md:max-w-none md:text-4xl text-ink">
                    Practice English with <span className="text-amber-400">saved words</span>
                  </h1>
                  <p className="mt-2 max-w-[300px] text-[13px] text-muted md:mt-3 md:max-w-md md:text-base">
                    Explain words, quiz yourself, or build a study plan.
                  </p>
                  <DeckBadges total={deckCards.length} due={dueCount} level={level} loading={cardsLoading} />
                  <div className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 md:mt-10 md:gap-3">
                    {SUGGESTED_ACTIONS.map(a => (
                      <ActionCard key={a.id} action={a} onClick={() => sendMessage(a.visibleMessage, a.mode)} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <div ref={scrollRef} className="space-y-4 pt-4 md:space-y-5 md:pt-6">
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <AiMessage msg={msg} />
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-full border border-line bg-bg-tertiary px-3.5 py-1.5 text-[12px] font-bold text-muted">
                    <Loader2 size={12} className="animate-spin" />
                    AI coach is thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Input */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-bg-primary via-bg-primary/95 to-transparent px-3 pb-8 pt-10 md:px-4 md:pb-10 md:pt-14">
        <div className="mx-auto max-w-2xl flex flex-col gap-2">
          <div className="hide-scrollbar flex overflow-x-auto gap-2 px-1">
            <button
              type="button"
              onClick={() => setInput(prev => (prev + " /unknowncard").trim())}
              className="flex items-center gap-1.5 rounded-full border border-line bg-bg-secondary/80 px-3 py-1.5 text-[11px] font-bold text-muted transition-colors hover:bg-bg-tertiary hover:text-ink backdrop-blur-md"
            >
              <Target size={12} className="text-rose-400" />
              + /unknowncard
            </button>
            <button
              type="button"
              onClick={() => setInput("words about ")}
              className="flex items-center gap-1.5 rounded-full border border-line bg-bg-secondary/80 px-3 py-1.5 text-[11px] font-bold text-muted transition-colors hover:bg-bg-tertiary hover:text-ink backdrop-blur-md"
            >
              <Layers size={12} className="text-blue-400" />
              Topic dictionary
            </button>
          </div>
          <form onSubmit={e => { e.preventDefault(); sendMessage(input) }}
            className="flex items-end gap-2 rounded-[2rem] border border-line bg-bg-secondary/90 p-1.5 shadow-modal backdrop-blur-3xl focus-within:border-accent/40 md:rounded-[2.5rem] md:p-2"
          >
            <textarea
              ref={inputRef} rows={1} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Ask AI coach..."
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted/40 md:px-4 md:py-3"
            />
            <button type="submit" disabled={!input.trim() || loading}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all md:h-12 md:w-12 ${
                input.trim() && !loading ? "bg-ink text-bg-primary active:scale-95" : "bg-bg-tertiary text-muted/20"
              }`}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

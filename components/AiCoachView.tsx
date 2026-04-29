"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowUp,
  BookOpenText,
  Brain,
  MessageCircle,
  PenLine,
  Sparkles,
  Target,
  Theater,
  UserRound,
  type LucideIcon
} from "lucide-react"

import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { getTodayDateKey, isDueDate } from "@/lib/date"
import { getGuestCards, isGuestSessionActive } from "@/lib/guest"
import { sortDueCards } from "@/lib/spaced-repetition"
import type { CardRecord, CardsResponse } from "@/lib/types"

type ChatRole = "assistant" | "user"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

interface AiChatResponse {
  reply: string
  mode: "study" | "fallback"
  source: "catalog" | "deepl" | "langeek" | null
}

const starterPrompts = [
  "Explain the word evidence",
  "Give me examples with progress",
  "Help me remember keep going",
  "Check the CEFR level of this sentence"
]

const aiModeIds = ["chat", "prompts", "story", "quiz", "memory", "roleplay", "review"] as const

type AiModeId = (typeof aiModeIds)[number]

interface AiMode {
  id: AiModeId
  label: string
  title: string
  description: string
  icon: LucideIcon
  prompts: string[]
  launchLabel: string
}

const aiModes: AiMode[] = [
  {
    id: "chat",
    label: "Chat",
    title: "AI study coach",
    description: "Ask anything about words, examples, pronunciation, grammar, or learning strategy.",
    icon: MessageCircle,
    prompts: starterPrompts,
    launchLabel: "Start coaching"
  },
  {
    id: "prompts",
    label: "Prompts",
    title: "Quick starts",
    description: "Fast study prompts for common vocabulary questions.",
    icon: Sparkles,
    prompts: starterPrompts,
    launchLabel: "Start prompt"
  },
  {
    id: "story",
    label: "Story",
    title: "Mini stories",
    description: "Turn vocabulary into a tiny scene so words feel alive instead of isolated.",
    icon: BookOpenText,
    prompts: [
      "Create a short A2 story using: progress, evidence, keep going",
      "Write a tiny dialogue with 5 useful phrases for a cafe",
      "Make a funny micro-story that helps me remember the word evidence"
    ],
    launchLabel: "Start story"
  },
  {
    id: "quiz",
    label: "Quiz",
    title: "Instant quiz",
    description: "Generate quick practice tasks from any word list or topic.",
    icon: Target,
    prompts: [
      "Quiz me on 5 B1 English words and wait for my answers",
      "Create a multiple-choice quiz for phrasal verbs with go",
      "Give me a fill-in-the-blank exercise for today"
    ],
    launchLabel: "Start quiz"
  },
  {
    id: "memory",
    label: "Memory",
    title: "Memory hooks",
    description: "Make mnemonics, associations, and visual hooks for hard words.",
    icon: Brain,
    prompts: [
      "Help me remember the difference between affect and effect",
      "Create a memory trick for the word evidence",
      "Make 3 associations for the phrase keep going"
    ],
    launchLabel: "Start memory drill"
  },
  {
    id: "roleplay",
    label: "Roleplay",
    title: "Roleplay mode",
    description: "Practice real conversations with a coach that corrects gently.",
    icon: Theater,
    prompts: [
      "Roleplay a job interview with me in English",
      "Act as a barista and help me order coffee naturally",
      "Practice small talk with me and correct my mistakes"
    ],
    launchLabel: "Start roleplay"
  },
  {
    id: "review",
    label: "Review",
    title: "Writing review",
    description: "Send a sentence and get cleaner wording, CEFR feedback, and one improvement tip.",
    icon: PenLine,
    prompts: [
      "Review this sentence: I very like learn English",
      "Improve my answer and explain the mistake: She go to school yesterday",
      "Check the CEFR level of this paragraph and give one upgrade"
    ],
    launchLabel: "Start review"
  }
]

function formatCardForAi(card: CardRecord) {
  const level = card.cefrLevel ? ` (${card.cefrLevel})` : ""

  return `${card.original} = ${card.translation}${level}`
}

function listCardsForAi(cards: CardRecord[], limit = 5) {
  return cards.slice(0, limit).map(formatCardForAi).join("; ")
}

function buildDeckPrompts(mode: AiMode, cards: CardRecord[], cefrLevel: string | null) {
  if (!cards.length) {
    return mode.prompts
  }

  const today = getTodayDateKey()
  const dueCards = cards.filter((card) => isDueDate(card.nextReviewDate, today))
  const unknownCards = cards.filter((card) => card.lastReviewResult === "unknown")
  const weakCards = [...cards]
    .sort((left, right) => right.wrongCount - left.wrongCount || left.correctCount - right.correctCount)
    .filter((card) => card.wrongCount > 0 || card.lastReviewResult === "unknown")
  const dueWords = listCardsForAi(dueCards.length ? dueCards : cards)
  const unknownWords = listCardsForAi(unknownCards.length ? unknownCards : cards)
  const weakWords = listCardsForAi(weakCards.length ? weakCards : cards)
  const deckWords = listCardsForAi(cards)
  const level = cefrLevel ?? "my current level"

  switch (mode.id) {
    case "story":
      return [
        `Create a ${level} mini-story using my deck words: ${deckWords}`,
        `Write a dialogue with these words from my cards: ${deckWords}`,
        `Make a memorable scene that connects these words: ${unknownWords}`
      ]
    case "quiz":
      return [
        `Quiz me on my due cards one by one: ${dueWords}`,
        `Create multiple-choice questions from my deck: ${deckWords}`,
        `Give me fill-in-the-blank practice for these cards: ${unknownWords}`
      ]
    case "memory":
      return [
        `Create memory hooks for my weak cards: ${weakWords}`,
        `Group these words into associations and patterns: ${deckWords}`,
        `Make mnemonic images for these difficult words: ${unknownWords}`
      ]
    case "roleplay":
      return [
        `Start a roleplay that naturally uses my deck words: ${deckWords}`,
        `Interview me and make me use these words correctly: ${unknownWords}`,
        `Create a real-life conversation at ${level} level using: ${deckWords}`
      ]
    case "review":
      return [
        `Check my level and give a review drill using my due cards: ${dueWords}`,
        `Find patterns in my weak cards and make a focused review plan: ${weakWords}`,
        `Create a 5-minute review session from my deck: ${deckWords}`
      ]
    case "prompts":
    case "chat":
    default:
      return [
        `Explain my due words with examples: ${dueWords}`,
        `Help me practice my unknown words: ${unknownWords}`,
        `Make a short study plan for my deck at ${level} level`
      ]
  }
}

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "I’m your AI study coach. Ask for a short explanation, pronunciation help, synonyms, examples, or CEFR feedback."
  }
]

export function AiCoachView() {
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeMenu, setActiveMenu] = useState<AiModeId>("chat")
  const [chatFlowMode, setChatFlowMode] = useState<AiModeId>("chat")
  const [guestMode, setGuestMode] = useState(false)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const {
    data: cardsPayload,
    loading: cardsLoading
  } = useClientResource<CardsResponse>({
    key: "cards:collection",
    enabled: !guestMode,
    revalidateOnMount: true,
    loader: async () => {
      const response = await fetch("/api/cards")

      if (!response.ok) {
        throw new Error("Could not load cards.")
      }

      return (await response.json()) as CardsResponse
    },
    onError: () => {
      showToast("Could not connect AI to your deck.", "error")
    }
  })

  const canSend = input.trim().length > 0 && !loading
  const activeMode = aiModes.find((mode) => mode.id === activeMenu) ?? aiModes[0]
  const ActiveModeIcon = activeMode.icon
  const currentFlowMode = aiModes.find((mode) => mode.id === chatFlowMode) ?? aiModes[0]
  const CurrentFlowIcon = currentFlowMode.icon
  const deckCards = useMemo(() => {
    if (guestMode) {
      return sortDueCards(getGuestCards())
    }

    return sortDueCards(cardsPayload?.cards ?? [])
  }, [cardsPayload?.cards, guestMode])
  const todayKey = getTodayDateKey()
  const dueCount = deckCards.filter((card) => isDueDate(card.nextReviewDate, todayKey)).length
  const modePrompts = useMemo(
    () => buildDeckPrompts(activeMode, deckCards, cardsPayload?.dailyCatalog.cefrLevel ?? null),
    [activeMode, cardsPayload?.dailyCatalog.cefrLevel, deckCards]
  )

  useEffect(() => {
    setGuestMode(isGuestSessionActive())
  }, [])

  useEffect(() => {
    if (!scrollerRef.current) {
      return
    }

    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    const textarea = inputRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "0px"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`
    textarea.style.overflowY = textarea.scrollHeight > 112 ? "auto" : "hidden"
  }, [input])

  async function sendMessage(value: string, mode: AiModeId = chatFlowMode) {
    const trimmed = value.trim()

    if (!trimmed || loading) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          mode,
          history: [...messages, userMessage].slice(-10).map((message) => ({
            role: message.role,
            content: message.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error("Could not reach the AI coach.")
      }

      const payload = (await response.json()) as AiChatResponse

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: payload.reply
        }
      ])
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not reach the AI coach.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="translate-page-shell -mx-4 -my-4 px-4 py-4 md:-mx-8 md:-my-8 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[14rem] bg-gradient-to-b from-black via-black/78 to-transparent"
          aria-hidden="true"
        />

        <div className="fixed left-1/2 top-3 z-30 w-[calc(100%-2rem)] max-w-[38rem] -translate-x-1/2 md:top-6">
          <div className="relative flex items-center justify-center gap-3">
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.03] p-1 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="hide-scrollbar flex min-w-0 gap-1 overflow-x-auto">
                {aiModes.map((mode) => {
                  const Icon = mode.icon
                  const active = activeMenu === mode.id

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveMenu(mode.id)}
                      className={`relative z-10 flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold transition ${
                        active
                          ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <Icon size={16} />
                      {mode.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <Link
              href="/profile"
              aria-label="Open profile"
              className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/74 shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition hover:bg-white/[0.06] hover:text-white"
            >
              <UserRound size={20} />
            </Link>
          </div>
        </div>

        <div className="h-[5.5rem] md:h-[6.75rem]" />

        <section className="group relative flex flex-col p-0 md:min-h-[72vh]">
          <div
            ref={scrollerRef}
            className="relative z-0 space-y-4 px-0 py-0 pb-[calc(var(--tab-bar-height)+104px)] transition-[padding-bottom] duration-200 ease-out group-focus-within:pb-[calc(env(safe-area-inset-bottom)+104px)] md:flex-1 md:overflow-y-auto md:pb-[132px]"
          >
            {activeMenu !== "chat" ? (
              <div className="translate-card rounded-[28px] px-5 py-5 text-white/78">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white">
                    <ActiveModeIcon size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/36">
                      AI idea
                    </p>
                    <h2 className="mt-1 text-[20px] font-black text-white">{activeMode.title}</h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/50">
                      {activeMode.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-white/58">
                    {cardsLoading ? "Connecting deck..." : `${deckCards.length} cards connected`}
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-white/58">
                    {dueCount} due today
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstPrompt = modePrompts[0]
                      setChatFlowMode(activeMode.id)
                      setActiveMenu("chat")
                      void sendMessage(firstPrompt, activeMode.id)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-black transition hover:translate-y-[-1px]"
                  >
                    <ActiveModeIcon size={13} />
                    {activeMode.launchLabel}
                  </button>
                </div>
              </div>
            ) : null}

            {activeMenu !== "chat" ? (
              <div className="grid gap-3 pb-1">
                {modePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setChatFlowMode(activeMode.id)
                      setActiveMenu("chat")
                      void sendMessage(prompt, activeMode.id)
                    }}
                    className="translate-card rounded-[24px] px-5 py-4 text-left text-[15px] font-semibold text-white/78 transition hover:translate-y-[-1px] hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-[28px] px-5 py-4 text-[15px] leading-relaxed shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${
                    message.role === "user"
                      ? "bg-white text-black"
                      : "bg-[linear-gradient(145deg,rgba(34,34,40,0.92),rgba(18,18,22,0.98))] text-white"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {messages.length === 1 && activeMenu === "chat" ? (
              <div className="grid gap-3 pt-1">
                {modePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setChatFlowMode(activeMode.id)
                      void sendMessage(prompt, activeMode.id)
                    }}
                    className="translate-card rounded-[24px] px-5 py-4 text-left text-[15px] font-semibold text-white/78 transition hover:translate-y-[-1px] hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            {loading ? (
              <div className="flex justify-start">
                <div className="ai-thinking-bubble">
                  <div className="ai-thinking-row">
                    <span className="ai-thinking-label">Thinking</span>
                    <span className="ai-thinking-dots" aria-hidden="true">
                      <span className="ai-thinking-dot" />
                      <span className="ai-thinking-dot" />
                      <span className="ai-thinking-dot" />
                    </span>
                  </div>
                  <div className="ai-thinking-glow" aria-hidden="true" />
                </div>
              </div>
            ) : null}
          </div>

          <form
            className="fixed bottom-[calc(var(--tab-bar-height)+12px)] left-1/2 z-40 w-[calc(100%-2rem)] max-w-[46rem] -translate-x-1/2 transition-[bottom] duration-200 ease-out focus-within:bottom-[calc(env(safe-area-inset-bottom)+8px)]"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage(input)
            }}
          >
            {chatFlowMode !== "chat" ? (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setChatFlowMode("chat")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12px] font-semibold text-white/68 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white"
                >
                  <CurrentFlowIcon size={13} />
                  {currentFlowMode.label} in chat
                </button>
              </div>
            ) : null}
            <div className="translate-card rounded-full border border-white/[0.06] bg-[#232329]/95 px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex min-h-12 items-end gap-2">
                <div className="min-w-0 flex-1 px-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Message AI coach..."
                    rows={1}
                    className="block min-h-7 w-full resize-none bg-transparent py-0.5 text-[16px] leading-[1.35] text-white outline-none placeholder:text-white/34"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                    canSend
                      ? "bg-white text-black hover:translate-y-[-1px]"
                      : "cursor-not-allowed bg-white/12 text-white/34"
                  }`}
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

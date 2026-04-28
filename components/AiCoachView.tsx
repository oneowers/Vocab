"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowUp, MessageCircle, Sparkles, UserRound } from "lucide-react"

import { useToast } from "@/components/Toast"

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
  "Translate understand",
  "Explain the word evidence",
  "Как переводится progress",
  "Translate this phrase: keep going"
]

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "I’m your AI study coach. Ask for a translation, a short explanation, pronunciation help, synonyms, or CEFR feedback."
  }
]

export function AiCoachView() {
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeMenu, setActiveMenu] = useState<"chat" | "prompts">("chat")
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const canSend = input.trim().length > 0 && !loading

  useEffect(() => {
    if (!scrollerRef.current) {
      return
    }

    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight
  }, [messages, loading])

  async function sendMessage(value: string) {
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
          message: trimmed
        })
      })

      if (!response.ok) {
        throw new Error("Could not reach the AI coach.")
      }

      const payload = (await response.json()) as AiChatResponse
      const sourceLabel = payload.source ? `\n\nSource: ${payload.source}` : ""

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `${payload.reply}${sourceLabel}`
        }
      ])
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not reach the AI coach.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="translate-page-shell -mx-4 -my-4 px-4 py-4 pb-[calc(92px+env(safe-area-inset-bottom))] md:-mx-8 md:-my-8 md:px-8 md:py-8 md:pb-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="fixed left-1/2 top-3 z-30 w-[calc(100%-2rem)] max-w-[38rem] -translate-x-1/2 md:top-6">
          <div className="relative flex items-center justify-center gap-3">
            <div className="relative flex rounded-full border border-white/[0.06] bg-white/[0.03] p-1 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div
                className={`absolute bottom-1 top-1 rounded-full border border-white/[0.1] bg-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  activeMenu === "chat" ? "translate-x-0" : "translate-x-full"
                }`}
                style={{ left: "0.25rem", width: "calc(50% - 0.25rem)" }}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setActiveMenu("chat")}
                className={`relative z-10 flex min-w-[140px] items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition ${
                  activeMenu === "chat" ? "text-white" : "text-white/50 hover:text-white"
                }`}
              >
                <MessageCircle size={16} />
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveMenu("prompts")}
                className={`relative z-10 flex min-w-[140px] items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition ${
                  activeMenu === "prompts" ? "text-white" : "text-white/50 hover:text-white"
                }`}
              >
                <Sparkles size={16} />
                Prompts
              </button>
            </div>
            <Link
              href="/profile"
              aria-label="Open profile"
              className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/74 shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition hover:bg-white/[0.06] hover:text-white"
            >
              <UserRound size={20} />
            </Link>
            <div
              className="pointer-events-none absolute inset-x-[-1rem] top-full h-24 bg-gradient-to-b from-black via-black/35 to-transparent md:inset-x-[-2rem]"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="h-[5.5rem] md:h-[6.75rem]" />

        <section className="relative flex min-h-[calc(100dvh-10.5rem-env(safe-area-inset-bottom))] flex-col p-0 md:min-h-[72vh]">
          <div
            ref={scrollerRef}
            className="flex-1 space-y-4 overflow-y-auto px-0 py-0 pb-[176px] md:pb-[132px]"
          >
            {activeMenu === "prompts" ? (
              <div className="grid gap-3 pb-1">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setActiveMenu("chat")
                      void sendMessage(prompt)
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
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
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
            className="fixed bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+12px)] left-1/2 z-40 mt-3 w-[calc(100%-2rem)] max-w-[46rem] -translate-x-1/2 md:absolute md:bottom-4 md:left-4 md:right-4 md:w-auto md:max-w-none md:translate-x-0"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage(input)
            }}
          >
            <div className="translate-card rounded-[28px] border border-white/[0.06] bg-[#232329]/95 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 px-2">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Message AI coach..."
                    rows={1}
                    className="h-11 max-h-36 w-full resize-none bg-transparent py-2 text-[15px] leading-[1.5] text-white outline-none placeholder:text-white/28"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
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

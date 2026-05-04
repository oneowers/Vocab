import { Book, ChevronRight, Layout, PenTool, Sparkles, Trophy, Search, X } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { GrammarSkillsPayload, WritingTaskType, GrammarWritingFeedback, GrammarSkillRecord, CefrLevel } from "@/lib/types"
import { WritingTaskSelector } from "./WritingTaskSelector"
import { WritingChallengePage } from "./WritingChallengePage"
import { WritingFeedbackPage } from "./WritingFeedbackPage"
import { GrammarLessonView } from "./GrammarLessonView"
import { GRAMMAR_TOPICS } from "@/lib/grammar-content"
import { useToast } from "./Toast"

// Sub-components from the grammar folder
import { GrammarStatsRow } from "./grammar/GrammarStatsRow"
import { RecommendedTopicCard } from "./grammar/RecommendedTopicCard"
import { GrammarTopicList } from "./grammar/GrammarTopicList"
import { GrammarFilters } from "./grammar/GrammarFilters"
import { GrammarQuizView } from "./GrammarQuizView"

interface GrammarPracticeViewProps {
  grammarData: GrammarSkillsPayload
  onBack: () => void
  initialSubMode?: GrammarViewMode
  appSettings: any
}

type GrammarViewMode = "DASHBOARD" | "LIBRARY" | "WRITING_CHALLENGE" | "LESSON" | "QUIZ"
export type GrammarFilterType = "all" | "weak" | "learning" | "strong" | "no_data"
export type GrammarSortType = "priority" | "weakest" | "recent" | "cefr"

export function GrammarPracticeView({ grammarData, onBack, initialSubMode, appSettings }: GrammarPracticeViewProps) {
  const { showToast } = useToast()
  const [mode, setMode] = useState<GrammarViewMode>(initialSubMode || "DASHBOARD")
  
  // Library / Dashboard State
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<GrammarFilterType>("all")
  const [cefrFilter, setCefrFilter] = useState<CefrLevel | "all">("all")
  const [sort, setSort] = useState<GrammarSortType>("priority")

  // Writing Challenge state
  const [writingStep, setWritingStep] = useState<"SELECT" | "CHALLENGE" | "FEEDBACK">("SELECT")
  const [taskType, setTaskType] = useState<WritingTaskType | null>(null)
  const [task, setTask] = useState<any>(null)
  const [loadingTask, setLoadingTask] = useState(false)
  const [userText, setUserText] = useState("")
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<GrammarWritingFeedback | null>(null)

  // Lesson state
  const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null)

  // Priority Logic (same as in GrammarView)
  const getPriority = (item: GrammarSkillRecord) => {
    const score = item.score
    const mistakeCount = item.negativeEvidenceCount
    let daysSinceLast = 0
    if (item.lastDetectedAt) {
      const last = new Date(item.lastDetectedAt).getTime()
      daysSinceLast = (Date.now() - last) / (1000 * 60 * 60 * 24)
    }
    return Math.max(0, -score) + (mistakeCount * 2) + (daysSinceLast * 0.2)
  }

  const sortedAndFilteredItems = useMemo(() => {
    return grammarData.items
      .filter(item => {
        const matchesSearch = 
          item.topic.titleEn.toLowerCase().includes(search.toLowerCase()) ||
          item.topic.titleRu.toLowerCase().includes(search.toLowerCase())
        const matchesCefr = cefrFilter === "all" || item.topic.cefrLevel === cefrFilter
        let matchesFilter = true
        if (filter === "weak") matchesFilter = item.score < -30
        if (filter === "learning") matchesFilter = item.score >= -30 && item.score < 30
        if (filter === "strong") matchesFilter = item.score >= 30
        if (filter === "no_data") matchesFilter = item.evidenceCount === 0
        return matchesSearch && matchesCefr && matchesFilter
      })
      .sort((a, b) => {
        if (sort === "priority") return getPriority(b) - getPriority(a)
        if (sort === "weakest") return a.score - b.score
        if (sort === "recent") {
          if (!a.lastDetectedAt) return 1
          if (!b.lastDetectedAt) return -1
          return new Date(b.lastDetectedAt).getTime() - new Date(a.lastDetectedAt).getTime()
        }
        if (sort === "cefr") {
          const levels: Record<CefrLevel, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }
          return levels[a.topic.cefrLevel] - levels[b.topic.cefrLevel]
        }
        return 0
      })
  }, [grammarData.items, search, filter, cefrFilter, sort])

  const mainRecommended = useMemo(() => {
    const items = grammarData.items
      .filter(item => item.score < 0)
      .sort((a, b) => getPriority(b) - getPriority(a))
    return items.length > 0 ? items[0] : null
  }, [grammarData.items])

  const handleStartWriting = async (type: WritingTaskType) => {
    setTaskType(type)
    setLoadingTask(true)
    setWritingStep("CHALLENGE")
    setUserText("")
    try {
      const response = await fetch("/api/practice/grammar-challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType: type })
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setTask(data.task)
    } catch (error) {
      showToast("Could not generate task. Try again.", "error")
      setWritingStep("SELECT")
    } finally {
      setLoadingTask(false)
    }
  }

  const handleCheckWriting = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/practice/grammar-challenge/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          userText,
          taskTitle: task?.title,
          taskPrompt: task?.prompt,
          targetGrammarTopics: task?.targetGrammarTopics,
          targetWords: task?.targetWords
        })
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setFeedback(data.feedback)
      setWritingStep("FEEDBACK")
    } catch (error) {
      showToast("Не удалось проверить текст. Попробуй ещё раз.", "error")
    } finally {
      setChecking(false)
    }
  }

  if (mode === "LESSON" && selectedTopicKey) {
    const lessonTopic = GRAMMAR_TOPICS[selectedTopicKey] ?? null
    return (
      <GrammarLessonView 
        topic={lessonTopic} 
        onBack={() => setMode("DASHBOARD")} 
        appSettings={appSettings}
      />
    )
  }
  
  if (mode === "QUIZ") {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <GrammarQuizView onBack={() => setMode("DASHBOARD")} />
      </div>
    )
  }

  if (mode === "WRITING_CHALLENGE") {
    if (writingStep === "SELECT") {
      return (
        <div className="mx-auto max-w-xl px-4 py-8">
          <header className="mb-10 flex items-center gap-4">
            <button
              onClick={() => setMode("DASHBOARD")}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-tertiary text-muted hover:bg-bg-tertiary/80 transition-all border border-line"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-[28px] font-black tracking-tight text-ink">Writing Practice</h1>
              <p className="text-[15px] font-medium text-muted">Choose your challenge type</p>
            </div>
          </header>
          <WritingTaskSelector onSelect={handleStartWriting} />
        </div>
      )
    }

    if (writingStep === "CHALLENGE") {
      return (
        <WritingChallengePage
          task={task}
          loading={loadingTask}
          userText={userText}
          onUserTextChange={setUserText}
          onCheck={handleCheckWriting}
          checking={checking}
          onBack={() => setWritingStep("SELECT")}
        />
      )
    }

    if (writingStep === "FEEDBACK" && feedback) {
      return (
        <WritingFeedbackPage
          feedback={feedback}
          onNewTask={() => setWritingStep("SELECT")}
          onFinish={() => setMode("DASHBOARD")}
        />
      )
    }
  }

  // Unified Practice Dashboard
  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-32">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-tertiary text-muted hover:bg-bg-tertiary/80 transition-all border border-line"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-ink">Grammar Practice</h1>
            <p className="text-[15px] font-medium text-muted">Improve your accuracy</p>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Trophy size={24} />
        </div>
      </header>

      <div className="space-y-6">
        {/* Main Practice Actions */}
        <div className="grid gap-4">
          <button
            onClick={() => {
              setMode("WRITING_CHALLENGE")
              setWritingStep("SELECT")
            }}
            className="group relative flex items-center justify-between overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-6 text-left transition-all hover:bg-emerald-500/10 active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                <PenTool size={24} />
              </div>
              <div>
                <h2 className="text-[18px] font-black text-ink">Writing Check</h2>
                <p className="text-[13px] text-emerald-500/60">AI feedback on your text</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-emerald-400/40" />
          </button>

          <button
            onClick={() => setMode("QUIZ")}
            className="group relative flex items-center justify-between overflow-hidden rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-6 text-left transition-all hover:bg-amber-500/10 active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/20">
                <Layout size={24} />
              </div>
              <div>
                <h2 className="text-[18px] font-black text-ink">Quick Quiz</h2>
                <p className="text-[13px] text-amber-400/60">Rapid grammar test</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-amber-400/40" />
          </button>
        </div>

        {/* Recommended Lesson */}
        {mainRecommended && (
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Sparkles size={14} className="text-purple-400" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-purple-400/60">Targeted Practice</h2>
            </div>
            <RecommendedTopicCard 
              item={mainRecommended} 
              onClick={() => {
                setSelectedTopicKey(mainRecommended.topic.key)
                setMode("LESSON")
              }}
            />
          </div>
        )}

        {/* Theory Link - Beautiful Banner */}
        <div className="pt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-bg-secondary/40 p-8 shadow-sm backdrop-blur-sm">
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Book size={28} />
              </div>
              <h3 className="text-[20px] font-black text-ink">Grammar Library</h3>
              <p className="mt-2 max-w-[240px] text-[14px] font-medium text-muted">
                Explore all topics, rules, and track your progress in the theory hub.
              </p>
              <a 
                href="/grammar" 
                className="mt-6 flex h-12 items-center gap-2 rounded-2xl bg-ink px-8 text-[14px] font-black text-bg-primary transition-transform hover:scale-105 active:scale-95"
              >
                Go to Theory
                <ChevronRight size={18} />
              </a>
            </div>
            
            {/* Decorative Background Elements */}
            <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
            <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-purple-500/5 blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ArrowLeft({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

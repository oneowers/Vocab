import { Book, ChevronRight, Layout, PenTool, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import type { GrammarSkillsPayload, WritingTaskType, GrammarWritingFeedback, GrammarSkillRecord, CefrLevel } from "@/lib/types"
import { WritingTaskSelector } from "./WritingTaskSelector"
import { WritingChallengePage } from "./WritingChallengePage"
import { WritingFeedbackPage } from "./WritingFeedbackPage"
import { GrammarLessonView } from "./GrammarLessonView"
import { GRAMMAR_TOPICS } from "@/lib/grammar-content"
import { useToast } from "./Toast"
import { AppleHeader, AppleCard, AppleSkillListItem } from "@/components/AppleDashboardComponents"

import { RecommendedTopicCard } from "./grammar/RecommendedTopicCard"
import { GrammarQuizView } from "./GrammarQuizView"

interface GrammarPracticeViewProps {
  grammarData: GrammarSkillsPayload
  onBack: () => void
  initialSubMode?: GrammarViewMode
  appSettings: any
}

type GrammarViewMode = "DASHBOARD" | "LIBRARY" | "WRITING_CHALLENGE" | "LESSON" | "QUIZ"

export function GrammarPracticeView({ grammarData, onBack, initialSubMode, appSettings }: GrammarPracticeViewProps) {
  const { showToast } = useToast()
  const [mode, setMode] = useState<GrammarViewMode>(initialSubMode || "DASHBOARD")
  
  const [writingStep, setWritingStep] = useState<"SELECT" | "CHALLENGE" | "FEEDBACK">("SELECT")
  const [taskType, setTaskType] = useState<WritingTaskType | null>(null)
  const [task, setTask] = useState<any>(null)
  const [loadingTask, setLoadingTask] = useState(false)
  const [userText, setUserText] = useState("")
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<GrammarWritingFeedback | null>(null)

  const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null)

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
        <div className="flex min-h-screen flex-col bg-black">
          <AppleHeader 
            title="Writing Practice" 
            onBack={() => setMode("DASHBOARD")}
            sticky={true}
          />
          <div className="mx-auto max-w-xl px-4 pt-24 pb-32">
            <header className="mb-10 px-1">
              <p className="text-[17px] font-bold text-white/40">Choose your challenge type</p>
            </header>
            <WritingTaskSelector onSelect={handleStartWriting} />
          </div>
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

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <AppleHeader 
        title="Grammar Practice" 
        onBack={onBack}
        sticky={true}
      />
 
      <div className="mx-auto max-w-xl px-4 pt-24 pb-32 space-y-8">
        <div className="px-1">
          <p className="text-[17px] font-bold text-white/40">Improve your accuracy with AI-powered exercises</p>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4">
            <AppleCard className="p-6 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setMode("WRITING_CHALLENGE"); setWritingStep("SELECT"); }}>
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  <PenTool size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-[18px] font-black text-white">Writing Check</h2>
                  <p className="text-[13px] text-white/60">AI feedback on your text</p>
                </div>
                <ChevronRight size={24} className="text-white/20" />
              </div>
            </AppleCard>

            <AppleCard className="p-6 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setMode("QUIZ")}>
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/20">
                  <Layout size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-[18px] font-black text-white">Quick Quiz</h2>
                  <p className="text-[13px] text-white/60">Rapid grammar test</p>
                </div>
                <ChevronRight size={24} className="text-white/20" />
              </div>
            </AppleCard>
          </div>

          {mainRecommended && (
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-4 px-1">
                <AlertTriangle size={14} className="text-amber-400" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-amber-400/60">Targeted Practice</h2>
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

          <div className="pt-8">
            <AppleCard className="p-8 relative overflow-hidden">
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Book size={28} />
                </div>
                <h3 className="text-[20px] font-black text-white">Grammar Library</h3>
                <p className="mt-2 max-w-[240px] text-[14px] font-medium text-white/60">
                  Explore all topics, rules, and track your progress in the theory hub.
                </p>
                <Link 
                  href="/grammar" 
                  className="mt-6 flex h-12 items-center gap-2 rounded-2xl bg-white px-8 text-[14px] font-black text-black transition-transform hover:scale-105 active:scale-95"
                >
                  Go to Theory
                  <ChevronRight size={18} />
                </Link>
              </div>
              
              <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
              <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-purple-500/5 blur-3xl" />
            </AppleCard>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Book, ChevronRight, Layout, PenTool, Sparkles, Trophy } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { GrammarSkillsPayload, WritingTaskType, GrammarWritingFeedback } from "@/lib/types"
import { WritingTaskSelector } from "./WritingTaskSelector"
import { WritingChallengePage } from "./WritingChallengePage"
import { WritingFeedbackPage } from "./WritingFeedbackPage"
import { GrammarLibraryView } from "./GrammarLibraryView"
import { GrammarLessonView } from "./GrammarLessonView"
import { useToast } from "./Toast"

interface GrammarPracticeViewProps {
  grammarData: GrammarSkillsPayload
  onBack: () => void
}

type GrammarViewMode = "DASHBOARD" | "LIBRARY" | "WRITING_CHALLENGE" | "LESSON" | "QUIZ"

export function GrammarPracticeView({ grammarData, onBack }: GrammarPracticeViewProps) {
  const { showToast } = useToast()
  const [mode, setMode] = useState<GrammarViewMode>("DASHBOARD")
  
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

  if (mode === "LIBRARY") {
    return (
      <GrammarLibraryView 
        grammarData={grammarData} 
        onBack={() => setMode("DASHBOARD")}
        onSelectTopic={(key) => {
          setSelectedTopicKey(key)
          setMode("LESSON")
        }}
      />
    )
  }

  if (mode === "LESSON" && selectedTopicKey) {
    return (
      <GrammarLessonView 
        topicKey={selectedTopicKey} 
        onBack={() => setMode("LIBRARY")} 
      />
    )
  }

  if (mode === "WRITING_CHALLENGE") {
    if (writingStep === "SELECT") {
      return (
        <div className="mx-auto max-w-xl px-4 py-8">
          <header className="mb-10 flex items-center gap-4">
            <button
              onClick={() => setMode("DASHBOARD")}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/5"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-[28px] font-black tracking-tight text-white">Writing Practice</h1>
              <p className="text-[15px] font-medium text-white/40">Choose your challenge type</p>
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

  // Dashboard
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/5"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-white">Learn Grammar</h1>
            <p className="text-[15px] font-medium text-white/40">Master English structures</p>
          </div>
        </div>
        
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Trophy size={24} />
        </div>
      </header>

      {/* Main Actions */}
      <div className="grid gap-4">
        {/* Continue Weak Topic */}
        {grammarData.items.length > 0 && (
          <button
            onClick={() => {
              setSelectedTopicKey(grammarData.items[0].topic.key)
              setMode("LESSON")
            }}
            className="group relative flex items-center justify-between overflow-hidden rounded-[2rem] border border-purple-500/30 bg-purple-500/10 p-6 text-left transition-all hover:bg-purple-500/20 active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/70">Continue learning</span>
                <h2 className="text-[18px] font-black text-white">{grammarData.items[0].topic.titleEn}</h2>
              </div>
            </div>
            <ChevronRight size={24} className="text-purple-400" />
          </button>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode("LIBRARY")}
            className="group flex flex-col items-start gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-left transition-all hover:bg-white/[0.06] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Book size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-white">Grammar Library</h3>
              <p className="mt-1 text-[12px] text-white/40">Browse all topics</p>
            </div>
          </button>

          <button
            onClick={() => {
              setMode("WRITING_CHALLENGE")
              setWritingStep("SELECT")
            }}
            className="group flex flex-col items-start gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-left transition-all hover:bg-white/[0.06] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <PenTool size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-white">Writing Practice</h3>
              <p className="mt-1 text-[12px] text-white/40">Use AI to check text</p>
            </div>
          </button>
        </div>

        <button
          onClick={() => setMode("QUIZ")}
          className="group relative flex items-center justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-left transition-all hover:bg-white/[0.06] active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Layout size={24} />
            </div>
            <div>
              <h2 className="text-[18px] font-black text-white">Quick Quiz</h2>
              <p className="text-[13px] text-white/40">Test your grammar knowledge</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-white/20" />
        </button>
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

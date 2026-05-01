"use client"

import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import type { GrammarSkillsPayload, WritingTaskType, GrammarWritingFeedback } from "@/lib/types"
import { WritingTaskSelector } from "./WritingTaskSelector"
import { WritingChallengePage } from "./WritingChallengePage"
import { WritingFeedbackPage } from "./WritingFeedbackPage"
import { useToast } from "./Toast"

interface GrammarPracticeViewProps {
  grammarData: GrammarSkillsPayload
  onBack: () => void
}

interface GeneratedTask {
  title: string
  prompt: string
  targetGrammarTopics: string[]
  targetWords?: string[]
}

export function GrammarPracticeView({ grammarData, onBack }: GrammarPracticeViewProps) {
  const { showToast } = useToast()
  const [step, setStep] = useState<"SELECT" | "CHALLENGE" | "FEEDBACK">("SELECT")
  const [taskType, setTaskType] = useState<WritingTaskType | null>(null)
  const [task, setTask] = useState<GeneratedTask | null>(null)
  const [loadingTask, setLoadingTask] = useState(false)
  
  const [userText, setUserText] = useState("")
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<GrammarWritingFeedback | null>(null)

  async function handleSelectType(type: WritingTaskType) {
    setTaskType(type)
    setLoadingTask(true)
    setStep("CHALLENGE")
    setUserText("")
    
    try {
      const response = await fetch("/api/practice/grammar-challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType: type })
      })
      
      if (!response.ok) throw new Error("Failed to generate task")
      
      const data = await response.json()
      setTask(data.task)
    } catch (error) {
      showToast("Could not generate task. Try again.", "error")
      setStep("SELECT")
    } finally {
      setLoadingTask(false)
    }
  }

  async function handleCheckGrammar() {
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

      if (!response.ok) throw new Error("Check failed")

      const data = await response.json()
      setFeedback(data.feedback)
      setStep("FEEDBACK")
    } catch (error) {
      showToast("Не удалось проверить текст. Попробуй ещё раз.", "error")
    } finally {
      setChecking(false)
    }
  }

  if (step === "SELECT") {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <header className="mb-10 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/5"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-white">Grammar Practice</h1>
            <p className="text-[15px] font-medium text-white/40">Master English through writing</p>
          </div>
        </header>
        <WritingTaskSelector onSelect={handleSelectType} />
      </div>
    )
  }

  if (step === "CHALLENGE") {
    return (
      <WritingChallengePage
        task={task}
        loading={loadingTask}
        userText={userText}
        onUserTextChange={setUserText}
        onCheck={handleCheckGrammar}
        checking={checking}
        onBack={() => setStep("SELECT")}
      />
    )
  }

  if (step === "FEEDBACK" && feedback) {
    return (
      <WritingFeedbackPage
        feedback={feedback}
        onNewTask={() => setStep("SELECT")}
        onFinish={onBack}
      />
    )
  }

  return null
}

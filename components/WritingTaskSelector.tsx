"use client"

import { BookOpen, HelpCircle, Layout, MessageSquare, PenTool, Sparkles, Type } from "lucide-react"
import { motion } from "framer-motion"
import type { WritingTaskType } from "@/lib/types"

interface TaskTypeOption {
  id: WritingTaskType
  title: string
  description: string
  icon: any
  color: string
}

const TASK_TYPES: TaskTypeOption[] = [
  {
    id: "grammar_focused",
    title: "Grammar Focused",
    description: "Practice specific weak grammar topics in your writing.",
    icon: Sparkles,
    color: "bg-purple-500"
  },
  {
    id: "short_paragraph",
    title: "Short Paragraph",
    description: "Write a short paragraph about a given topic.",
    icon: Layout,
    color: "bg-blue-500"
  },
  {
    id: "words_in_sentences",
    title: "Words in Sentences",
    description: "Use your saved words in meaningful sentences.",
    icon: Type,
    color: "bg-emerald-500"
  },
  {
    id: "answer_question",
    title: "Answer a Question",
    description: "Answer an AI-generated question using specific words.",
    icon: HelpCircle,
    color: "bg-amber-500"
  },
  {
    id: "rewrite_sentences",
    title: "Rewrite Sentences",
    description: "Fix grammar mistakes in generated incorrect examples.",
    icon: PenTool,
    color: "bg-rose-500"
  },
  {
    id: "ielts_mini",
    title: "IELTS Mini Writing",
    description: "Short IELTS-style tasks (Task 1 or Task 2 basics).",
    icon: BookOpen,
    color: "bg-indigo-500"
  },
  {
    id: "story_mode",
    title: "Story Mode",
    description: "Write a creative story using your vocabulary.",
    icon: MessageSquare,
    color: "bg-orange-500"
  }
]

interface WritingTaskSelectorProps {
  onSelect: (type: WritingTaskType) => void
}

export function WritingTaskSelector({ onSelect }: WritingTaskSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TASK_TYPES.map((task, index) => (
        <motion.button
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(task.id)}
          className="group relative flex items-start gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:bg-white/[0.06] hover:shadow-lg active:scale-[0.98]"
        >
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${task.color} bg-opacity-20 ${task.color.replace('bg-', 'text-').replace('500', '400')} border border-white/10`}>
            <task.icon size={24} />
          </span>
          <span>
            <h3 className="text-[17px] font-bold text-white group-hover:text-white/90">
              {task.title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-white/40">
              {task.description}
            </p>
          </span>
        </motion.button>
      ))}
    </div>
  )
}

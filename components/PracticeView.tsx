"use client"

import { useState } from "react"
import { PracticeModeSelector } from "@/components/PracticeModeSelector"
import { ReviewSession } from "@/components/ReviewSession"
import { GrammarPracticeView } from "@/components/GrammarPracticeView"
import { TranslationChallengeView } from "@/components/TranslationChallengeView"
import type { CardsResponse, GrammarSkillsPayload } from "@/lib/types"

interface PracticeViewProps {
  initialData: {
    reviewData: CardsResponse
    grammarData: GrammarSkillsPayload
    historyData: any[]
    appSettings: any
  }
  initialMode?: "SELECT" | "WORDS" | "GRAMMAR" | "TRANSLATION" | "HISTORY"
}

import { GrammarHistoryView } from "@/components/GrammarHistoryView"

export function PracticeView({ initialData, initialMode }: PracticeViewProps) {
  const [mode, setMode] = useState<"SELECT" | "WORDS" | "GRAMMAR" | "TRANSLATION" | "HISTORY">(
    (initialMode?.toUpperCase() as any) || "SELECT"
  )
  const [grammarSubMode, setGrammarSubMode] = useState<any>(null)

  if (mode === "HISTORY") {
    return <GrammarHistoryView historyData={initialData.historyData} onBack={() => setMode("SELECT")} />
  }

  if (mode === "TRANSLATION") {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-2xl mx-auto pt-8 px-4 flex items-center justify-between">
          <button 
            onClick={() => setMode("SELECT")}
            className="text-[15px] font-semibold text-[#0A84FF] active:opacity-60 transition-opacity"
          >
            Done
          </button>
        </div>
        <TranslationChallengeView onBack={() => setMode("SELECT")} />
      </div>
    )
  }

  if (mode === "WORDS") {
    return (
      <div className="min-h-screen">
        <ReviewSession initialData={initialData.reviewData} />
      </div>
    )
  }

  if (mode === "GRAMMAR") {
    return (
      <GrammarPracticeView 
        grammarData={initialData.grammarData} 
        onBack={() => {
          setMode("SELECT")
          setGrammarSubMode(null)
        }}
        initialSubMode={grammarSubMode}
        appSettings={initialData.appSettings}
      />
    )
  }

  return (
    <PracticeModeSelector
      onSelectWords={() => setMode("WORDS")}
      onSelectGrammar={() => setMode("GRAMMAR")}
      onSelectWriting={() => {
        setGrammarSubMode("WRITING_CHALLENGE")
        setMode("GRAMMAR")
      }}
      onSelectQuiz={() => {
        setGrammarSubMode("QUIZ")
        setMode("GRAMMAR")
      }}
      onSelectTranslation={() => setMode("TRANSLATION")}
      onSelectHistory={() => setMode("HISTORY")}
      dueCount={initialData.reviewData.summary.dueToday}
      weakGrammarCount={initialData.grammarData.weakCount}
      historyData={initialData.historyData}
    />
  )
}

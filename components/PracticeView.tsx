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
  }
  initialMode?: "SELECT" | "WORDS" | "GRAMMAR"
}

export function PracticeView({ initialData, initialMode }: PracticeViewProps) {
  const [mode, setMode] = useState<"SELECT" | "WORDS" | "GRAMMAR" | "TRANSLATION">(
    (initialMode?.toUpperCase() as any) || "SELECT"
  )
  const [grammarSubMode, setGrammarSubMode] = useState<any>(null)

  if (mode === "TRANSLATION") {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-2xl mx-auto pt-8 px-4 flex items-center justify-between">
          <button 
            onClick={() => setMode("SELECT")}
            className="text-quiet hover:text-ink font-bold flex items-center gap-2 transition-colors"
          >
            ← Exit
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
      dueCount={initialData.reviewData.summary.dueToday}
      weakGrammarCount={initialData.grammarData.weakCount}
    />
  )
}

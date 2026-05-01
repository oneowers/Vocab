"use client"

import { useState } from "react"
import { PracticeModeSelector } from "@/components/PracticeModeSelector"
import { ReviewSession } from "@/components/ReviewSession"
import { GrammarPracticeView } from "@/components/GrammarPracticeView"
import type { CardsResponse, GrammarSkillsPayload } from "@/lib/types"

interface PracticeViewProps {
  initialData: {
    reviewData: CardsResponse
    grammarData: GrammarSkillsPayload
  }
}

export function PracticeView({ initialData }: PracticeViewProps) {
  const [mode, setMode] = useState<"SELECT" | "WORDS" | "GRAMMAR">("SELECT")

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
        onBack={() => setMode("SELECT")}
      />
    )
  }

  return (
    <PracticeModeSelector
      onSelectWords={() => setMode("WORDS")}
      onSelectGrammar={() => setMode("GRAMMAR")}
      dueCount={initialData.reviewData.summary.dueToday}
      weakGrammarCount={initialData.grammarData.weakCount}
    />
  )
}

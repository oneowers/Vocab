"use client"

import { useState } from "react"
import { PracticeModeSelector } from "@/components/PracticeModeSelector"
import { ReviewSession } from "@/components/ReviewSession"
import { GrammarPracticeView } from "@/components/GrammarPracticeView"
import { TranslationChallengeView } from "@/components/TranslationChallengeView"
import { PracticeModesSkeleton } from "@/components/practice/PracticeModesSkeleton"
import { GrammarTopicsSkeleton } from "@/components/grammar/GrammarTopicsSkeleton"
import { useClientResource } from "@/hooks/useClientResource"
import type { GrammarFindingRecord, GrammarSkillsPayload, PracticeEntryPayload } from "@/lib/types"

interface PracticeViewProps {
  initialData: PracticeEntryPayload
  initialMode?: "SELECT" | "WORDS" | "GRAMMAR" | "TRANSLATION" | "HISTORY"
}

import { GrammarHistoryView } from "@/components/GrammarHistoryView"

export function PracticeView({ initialData, initialMode }: PracticeViewProps) {
  const [mode, setMode] = useState<"SELECT" | "WORDS" | "GRAMMAR" | "TRANSLATION" | "HISTORY">(
    (initialMode?.toUpperCase() as any) || "SELECT"
  )
  const [grammarSubMode, setGrammarSubMode] = useState<any>(null)
  const { data: grammarData, loading: grammarLoading } = useClientResource<GrammarSkillsPayload>({
    key: "practice:grammar:weak",
    enabled: mode === "GRAMMAR",
    staleTimeMs: 60_000,
    loader: async () => {
      const response = await fetch("/api/profile/grammar-skills?scope=weak", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load grammar practice.")
      }

      return (await response.json()) as GrammarSkillsPayload
    }
  })
  const { data: historyData, loading: historyLoading } = useClientResource<GrammarFindingRecord[]>({
    key: "practice:history",
    enabled: mode === "HISTORY",
    staleTimeMs: 60_000,
    loader: async () => {
      const response = await fetch("/api/practice/history", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load practice history.")
      }

      return (await response.json()) as GrammarFindingRecord[]
    }
  })

  if (mode === "HISTORY") {
    if (historyLoading && !historyData) {
      return <PracticeModesSkeleton />
    }

    return <GrammarHistoryView historyData={historyData ?? initialData.historyPreview} onBack={() => setMode("SELECT")} />
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
        <ReviewSession initialData={null} />
      </div>
    )
  }

  if (mode === "GRAMMAR") {
    if (grammarLoading && !grammarData) {
      return <GrammarTopicsSkeleton />
    }

    return (
      <GrammarPracticeView 
        grammarData={grammarData ?? { items: [], weakCount: initialData.grammarSummary.weakCount, trend: initialData.grammarSummary.trend }} 
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
      dueCount={initialData.reviewSummary.summary.dueToday}
      weakGrammarCount={initialData.grammarSummary.weakCount}
      historyData={initialData.historyPreview}
    />
  )
}

"use client"

import { ArrowLeft, BookOpen, ChevronRight, Lock, Sparkles, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { GRAMMAR_TOPICS } from "@/lib/grammar-content"
import type { GrammarSkillsPayload } from "@/lib/types"
import { AppleHeader, AppleCard, AppleSkillListItem } from "@/components/AppleDashboardComponents"

interface GrammarLibraryViewProps {
  grammarData: GrammarSkillsPayload
  onBack: () => void
  onSelectTopic: (key: string) => void
}

export function GrammarLibraryView({ grammarData, onBack, onSelectTopic }: GrammarLibraryViewProps) {
  const topics = Object.values(GRAMMAR_TOPICS)

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <AppleHeader
        title="Grammar Library"
        onBack={onBack}
        sticky={true}
      />

      <div className="mx-auto max-w-xl px-4 pt-24 pb-32 space-y-4">
        <div className="px-1 mb-4">
          <p className="text-[17px] font-bold text-white/40">Explore all topics from A1 to B2</p>
        </div>

        <AppleCard className="overflow-hidden">
          {topics.map((topic, index) => {
            const skill = grammarData.items.find(item => item.topic.key === topic.key)
            const score = skill?.score ?? 0

            return (
              <AppleSkillListItem
                key={topic.key}
                title={topic.titleEn}
                subtitle={topic.descriptionEn}
                level={topic.cefrLevel}
                status={score < -20 ? "Weak" : score > 40 ? "Strong" : "Learning"}
                points={score}
                progress={Math.max(10, (score + 100) / 2)}
                onClick={() => onSelectTopic(topic.key)}
                showDivider={index < topics.length - 1}
              />
            )
          })}
        </AppleCard>
      </div>
    </div>
  )
}

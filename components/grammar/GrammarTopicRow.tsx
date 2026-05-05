import React from "react"
import { AppleSkillListItem } from "@/components/AppleDashboardComponents"
import type { GrammarSkillRecord } from "@/lib/types"

export function GrammarTopicRow({ item, index, onClick, isLast = false }: { item: GrammarSkillRecord, index: number, onClick?: () => void, isLast?: boolean }) {
  const scoreBand = item.score < -30 ? "Weak" : item.score < 30 ? "Learning" : "Strong"
  
  const hasEvidence = item.evidenceCount > 0
  const progress = hasEvidence ? Math.max(5, (item.score + 100) / 2) : 0

  return (
    <AppleSkillListItem
      title={item.topic.titleEn}
      subtitle={item.topic.titleRu}
      level={item.topic.cefrLevel}
      status={hasEvidence ? scoreBand : "New"}
      points={item.score}
      progress={progress}
      onClick={onClick}
      showDivider={!isLast}
    />
  )
}

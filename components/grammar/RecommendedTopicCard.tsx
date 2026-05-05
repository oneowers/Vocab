"use client"

import React from "react"
import { AppleRecommendedCard } from "@/components/AppleDashboardComponents"
import type { GrammarSkillRecord } from "@/lib/types"

export function RecommendedTopicCard({ item, onClick }: { item: GrammarSkillRecord; onClick?: () => void }) {
  const progress = Math.max(10, (item.score + 100) / 2)

  return (
    <AppleRecommendedCard
      title={item.topic.titleEn}
      subtitle={item.topic.titleRu}
      points={item.score}
      progress={progress}
      onClick={onClick}
    />
  )
}

"use client"

import { useClientResource } from "@/hooks/useClientResource"
import type { GrammarSkillsPayload, GrammarSummaryPayload, GrammarTopicsPayload } from "@/lib/types"

import { GrammarTopicsSkeleton } from "@/components/grammar/GrammarTopicsSkeleton"
import { GrammarView } from "@/components/grammar/GrammarView"

export function GrammarClientView() {
  const { data: summary, loading: summaryLoading } = useClientResource<GrammarSummaryPayload>({
    key: "grammar:summary",
    staleTimeMs: 60_000,
    priority: "high",
    loader: async () => {
      const response = await fetch("/api/grammar/summary", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load grammar summary.")
      }

      return (await response.json()) as GrammarSummaryPayload
    }
  })
  const { data: topics, loading: topicsLoading } = useClientResource<GrammarTopicsPayload>({
    key: "grammar:topics:all",
    staleTimeMs: 60_000,
    priority: "low",
    loader: async () => {
      const response = await fetch("/api/grammar/topics?scope=all", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load grammar topics.")
      }

      return (await response.json()) as GrammarTopicsPayload
    }
  })

  const payload: GrammarSkillsPayload | null =
    summary && topics
      ? {
          items: topics.items,
          weakCount: summary.weakCount,
          trend: summary.trend
        }
      : null

  if (summaryLoading && !summary) {
    return <GrammarTopicsSkeleton />
  }

  if (!summary) {
    return <GrammarTopicsSkeleton />
  }

  return <GrammarView payload={payload} summary={summary} topicsLoading={topicsLoading} />
}

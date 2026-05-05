"use client"

import { useClientResource } from "@/hooks/useClientResource"
import type { PracticeEntryPayload } from "@/lib/types"

import { PracticeModesSkeleton } from "@/components/practice/PracticeModesSkeleton"
import { PracticeView } from "@/components/PracticeView"

export function PracticePageContent({
  initialMode
}: {
  initialMode?: "SELECT" | "WORDS" | "GRAMMAR" | "TRANSLATION" | "HISTORY"
}) {
  const { data, loading } = useClientResource<PracticeEntryPayload>({
    key: "practice:entry",
    staleTimeMs: 60_000,
    loader: async () => {
      const response = await fetch("/api/practice/entry", {
        cache: "no-store"
      })

      if (!response.ok) {
        throw new Error("Could not load practice page.")
      }

      return (await response.json()) as PracticeEntryPayload
    }
  })

  if (loading && !data) {
    return <PracticeModesSkeleton />
  }

  if (!data) {
    return <PracticeModesSkeleton />
  }

  return <PracticeView initialData={data} initialMode={initialMode} />
}

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requireSignedInAppUser } from "@/lib/auth"
import { getUserGrammarSkillsData } from "@/lib/grammar"
import type { GrammarScoreBand } from "@/lib/types"

const BAND_LABELS: Record<GrammarScoreBand, string> = {
  unknown: "Unknown",
  minor: "Minor",
  weak: "Weak",
  serious: "Serious",
  critical: "Critical",
  strong: "Strong"
}

const BAND_STYLES: Record<GrammarScoreBand, string> = {
  unknown: "bg-white/[0.06] text-text-tertiary",
  minor: "bg-amber-500/10 text-amber-200",
  weak: "bg-rose-500/10 text-rose-200",
  serious: "bg-red-500/15 text-red-200",
  critical: "bg-red-500/25 text-red-100",
  strong: "bg-emerald-500/10 text-emerald-200"
}

function formatDate(value: string | null) {
  if (!value) {
    return "No evidence yet"
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

export default async function GrammarSkillsPage() {
  const user = await requireSignedInAppUser()
  const payload = await getUserGrammarSkillsData(user.id, "all")

  return (
    <div className="space-y-5">
      <section className="panel rounded-[2rem] p-5">
        <Link
          href="/profile"
          prefetch
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to profile
        </Link>
        <p className="section-label mt-5">Grammar Skills</p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.5px] text-ink">
          All grammar topics
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Scores start at 0 until LexiFlow has enough evidence from AI writing checks.
        </p>
      </section>

      <section className="space-y-3">
        {payload.items.map((item) => (
          <article
            key={item.topic.id}
            id={item.topic.key}
            className="panel rounded-[1.5rem] p-4 scroll-mt-24"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[17px] font-bold text-ink">{item.topic.titleEn}</h2>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    {item.topic.cefrLevel}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${BAND_STYLES[item.scoreBand]}`}>
                    {BAND_LABELS[item.scoreBand]}
                  </span>
                </div>
                <p className="mt-1 text-[13px] font-semibold text-text-tertiary">
                  {item.topic.titleRu}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[24px] font-black text-ink">{item.score}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Score
                </p>
              </div>
            </div>

            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              {item.latestFinding?.explanationRu || item.topic.description}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-[14px] bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Evidence
                </p>
                <p className="mt-1 text-[17px] font-bold text-ink">{item.evidenceCount}</p>
              </div>
              <div className="rounded-[14px] bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Mistakes
                </p>
                <p className="mt-1 text-[17px] font-bold text-ink">{item.negativeEvidenceCount}</p>
              </div>
              <div className="rounded-[14px] bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Last detected
                </p>
                <p className="mt-1 text-[13px] font-bold text-ink">{formatDate(item.lastDetectedAt)}</p>
              </div>
            </div>

            {item.latestFinding ? (
              <div className="mt-4 rounded-[16px] border border-rose-500/15 bg-rose-500/5 p-3">
                <p className="text-[13px] font-medium text-rose-200 line-through decoration-rose-500/50">
                  {item.latestFinding.original}
                </p>
                <p className="mt-1 text-[14px] font-bold text-emerald-300">
                  {item.latestFinding.corrected}
                </p>
              </div>
            ) : item.topic.examples.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.topic.examples.slice(0, 3).map((example) => (
                  <span
                    key={example}
                    className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[12px] text-text-tertiary"
                  >
                    {example}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  )
}

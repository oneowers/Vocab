"use client"

import Link from "next/link"
import React, { useMemo, useState } from "react"
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2,
  ChevronDown, 
  Filter, 
  History, 
  LayoutGrid, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Zap 
} from "lucide-react"

import type { 
  CefrLevel, 
  GrammarSkillRecord, 
  GrammarSkillsPayload, 
  GrammarScoreBand 
} from "@/lib/types"

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

type FilterType = "all" | "weak" | "practice" | "no_data" | "strong"
type SortType = "weakest" | "mistakes" | "recent" | "cefr"

interface GrammarSkillsDashboardProps {
  payload: GrammarSkillsPayload
}

export function GrammarSkillsDashboard({ payload }: GrammarSkillsDashboardProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [cefrFilter, setCefrFilter] = useState<CefrLevel | "all">("all")
  const [sort, setSort] = useState<SortType>("weakest")

  const summary = useMemo(() => {
    const withEvidence = payload.items.filter(item => item.evidenceCount > 0)
    const totalMistakes = withEvidence.reduce((acc, item) => acc + item.negativeEvidenceCount, 0)
    const avgScore = withEvidence.length > 0 
      ? Math.round(withEvidence.reduce((acc, item) => acc + item.score, 0) / withEvidence.length)
      : 0

    return {
      weakCount: payload.weakCount,
      withEvidenceCount: withEvidence.length,
      totalMistakes,
      totalCorrect: withEvidence.reduce((acc, item) => acc + item.positiveEvidenceCount, 0),
      avgScore
    }
  }, [payload])

  const filteredItems = useMemo(() => {
    return payload.items
      .filter((item) => {
        const matchesSearch = 
          item.topic.titleEn.toLowerCase().includes(search.toLowerCase()) ||
          item.topic.titleRu.toLowerCase().includes(search.toLowerCase()) ||
          item.topic.category.toLowerCase().includes(search.toLowerCase())

        const matchesCefr = cefrFilter === "all" || item.topic.cefrLevel === cefrFilter

        let matchesFilter = true
        if (filter === "weak") matchesFilter = item.score < -15 && item.evidenceCount > 0
        if (filter === "practice") matchesFilter = item.score >= -15 && item.score < 0 && item.evidenceCount > 0
        if (filter === "no_data") matchesFilter = item.evidenceCount === 0
        if (filter === "strong") matchesFilter = item.score > 0

        return matchesSearch && matchesCefr && matchesFilter
      })
      .sort((a, b) => {
        if (sort === "weakest") return a.score - b.score
        if (sort === "mistakes") return b.negativeEvidenceCount - a.negativeEvidenceCount
        if (sort === "recent") {
          if (!a.lastDetectedAt) return 1
          if (!b.lastDetectedAt) return -1
          return new Date(b.lastDetectedAt).getTime() - new Date(a.lastDetectedAt).getTime()
        }
        if (sort === "cefr") {
          const levels: Record<CefrLevel, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }
          return levels[a.topic.cefrLevel] - levels[b.topic.cefrLevel]
        }
        return 0
      })
  }, [payload.items, search, filter, cefrFilter, sort])

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-32 md:space-y-8">
      {/* 1. Header Section */}
      <header className="space-y-4 px-4 md:space-y-6 md:px-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/profile"
              prefetch
              className="inline-flex items-center gap-2 text-xs font-bold text-text-tertiary transition hover:text-text-primary md:text-sm"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
            <h1 className="mt-2 text-[26px] font-black tracking-tight text-white md:mt-4 md:text-[40px]">
              Grammar Skills
            </h1>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-text-secondary md:mt-2 md:text-[16px]">
              LexiFlow analyzes your writing to detect grammar weaknesses. 
              Improve your score by completing writing challenges correctly.
            </p>
          </div>
          <Link href="/practice" prefetch className="button-primary h-[52px] w-full px-8 text-base md:h-14 md:w-auto md:text-lg">
            <Sparkles size={18} />
            Start writing check
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <GrammarSummaryCard 
            label="Weak topics" 
            value={summary.weakCount} 
            icon={<TrendingUp size={18} />}
            color="rose"
          />
          <GrammarSummaryCard 
            label="With evidence" 
            value={summary.withEvidenceCount} 
            icon={<Zap size={18} />}
            color="amber"
          />
          <GrammarSummaryCard 
            label="Total mistakes" 
            value={summary.totalMistakes} 
            icon={<History size={18} />}
            color="rose"
          />
          <GrammarSummaryCard 
            label="Correct uses" 
            value={summary.totalCorrect} 
            icon={<CheckCircle2 size={18} />}
            color="emerald"
          />
        </div>
      </header>

      {/* 2. Filters and Search */}
      <GrammarFilters 
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        cefrFilter={cefrFilter}
        onCefrFilterChange={setCefrFilter}
        sort={sort}
        onSortChange={setSort}
      />

      {/* 3. Topic Cards List */}
      <section className="grid gap-4 md:grid-cols-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <GrammarTopicCard key={item.topic.id} item={item} />
          ))
        ) : (
          <div className="panel col-span-full py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
              <Search size={28} className="text-text-tertiary" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">No topics found</h3>
            <p className="mt-1 text-text-secondary">Try adjusting your filters or search query.</p>
          </div>
        )}
      </section>
    </div>
  )
}

function GrammarSummaryCard({ 
  label, 
  value, 
  icon, 
  color
}: { 
  label: string
  value: number
  icon: React.ReactNode
  color: "rose" | "amber" | "indigo" | "emerald"
}) {
  const colorMap = {
    rose: "text-rose-400 bg-rose-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    indigo: "text-indigo-400 bg-indigo-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10"
  }

  return (
    <div className="panel flex flex-col justify-between p-3.5 md:p-5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg md:h-9 md:w-9 md:rounded-xl ${colorMap[color]}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
      <div className="mt-3 md:mt-6">
        <p className="text-[24px] font-black text-white md:text-[32px]">
          {value}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-tight text-text-tertiary md:text-sm md:tracking-widest">
          {label}
        </p>
      </div>
    </div>
  )
}

function GrammarFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  cefrFilter,
  onCefrFilterChange,
  sort,
  onSortChange
}: {
  search: string
  onSearchChange: (val: string) => void
  filter: FilterType
  onFilterChange: (val: FilterType) => void
  cefrFilter: CefrLevel | "all"
  onCefrFilterChange: (val: CefrLevel | "all") => void
  sort: SortType
  onSortChange: (val: SortType) => void
}) {
  const filterChips: Array<{ id: FilterType; label: string }> = [
    { id: "all", label: "All" },
    { id: "weak", label: "Weak" },
    { id: "practice", label: "Practice" },
    { id: "strong", label: "Strong" },
    { id: "no_data", label: "No Data" }
  ]

  return (
    <div className="flex flex-col gap-3 px-4 md:gap-4 md:px-0 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search topics..."
          className="input-field h-11 w-full pl-11 pr-4 text-sm md:h-12 md:text-base"
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="hide-scrollbar flex overflow-x-auto rounded-xl bg-white/[0.04] p-1 md:rounded-2xl">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onFilterChange(chip.id)}
              className={`whitespace-nowrap rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition md:rounded-[12px] md:px-4 md:text-sm ${
                filter === chip.id 
                  ? "bg-white text-black shadow-lg" 
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex">
          <div className="relative">
            <select
              value={cefrFilter}
              onChange={(e) => onCefrFilterChange(e.target.value as CefrLevel | "all")}
              className="input-field h-10 w-full min-w-[100px] appearance-none pl-3 pr-8 text-[13px] font-bold md:h-12 md:pl-4 md:pr-10 md:text-sm"
            >
              <option value="all">Level: All</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortType)}
              className="input-field h-10 w-full min-w-[140px] appearance-none pl-3 pr-8 text-[13px] font-bold md:h-12 md:pl-4 md:pr-10 md:text-sm"
            >
              <option value="weakest">Weakest first</option>
              <option value="mistakes">Most mistakes</option>
              <option value="recent">Recently detected</option>
              <option value="cefr">CEFR Level</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          </div>
        </div>
      </div>
    </div>
  )
}

function GrammarTopicCard({ item }: { item: GrammarSkillRecord }) {
  const hasEvidence = item.evidenceCount > 0

  return (
    <article className="panel flex h-full flex-col p-4 transition-all hover:bg-white/[0.03] group md:p-5">
      <div className="flex flex-1 flex-col gap-3 md:gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <h3 className="truncate text-base font-black tracking-tight text-white md:text-lg">
                {item.topic.titleEn}
              </h3>
              <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/40 md:px-2 md:text-[10px]">
                {item.topic.cefrLevel}
              </span>
              <GrammarStatusBadge item={item} />
            </div>
            <p className="mt-0.5 truncate text-[13px] font-bold text-text-tertiary md:text-[14px]">
              {item.topic.titleRu}
            </p>
          </div>
          {hasEvidence && (
            <div className="text-right">
              <p className="text-xl font-black text-white md:text-2xl">{item.score}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary md:text-[10px]">Score</p>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-[13px] leading-relaxed text-text-secondary md:text-[14px]">
          {item.topic.description}
        </p>

        {/* Score Visualization or Empty State */}
        <div className="flex-1 py-1">
          {hasEvidence ? (
            <ScoreIndicator score={item.score} />
          ) : (
            <EmptyEvidenceState />
          )}
        </div>

        {/* Recent Finding or Examples */}
        {item.latestFinding ? (
          <div className={`rounded-xl border p-3 md:rounded-[20px] md:p-4 ${
            item.latestFinding.isCorrect 
              ? "border-emerald-500/10 bg-emerald-500/[0.02]" 
              : "border-rose-500/10 bg-rose-500/[0.02]"
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              {item.latestFinding.isCorrect ? (
                <CheckCircle2 size={12} className="text-emerald-400" />
              ) : (
                <History size={12} className="text-rose-400" />
              )}
              <p className={`text-[9px] font-bold uppercase tracking-widest md:text-[11px] ${
                item.latestFinding.isCorrect ? "text-emerald-300/50" : "text-rose-300/50"
              }`}>
                {item.latestFinding.isCorrect ? "Mastered" : "Latest Detection"}
              </p>
            </div>
            {!item.latestFinding.isCorrect && (
              <p className="text-[13px] font-medium text-rose-200/60 line-through decoration-rose-500/40 md:text-[14px]">
                {item.latestFinding.original}
              </p>
            )}
            <p className="text-[14px] font-black text-emerald-400 md:text-[15px]">
              {item.latestFinding.corrected}
            </p>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-text-secondary italic md:text-[13px]">
              {item.latestFinding.explanationRu}
            </p>
          </div>
        ) : item.topic.examples.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary md:text-[10px]">Examples</p>
            <div className="flex flex-wrap gap-1.5">
              {item.topic.examples.slice(0, 2).map((example, i) => (
                <span 
                  key={i} 
                  className="rounded-lg bg-white/[0.03] border border-white/[0.02] px-2 py-0.5 text-[11px] font-medium text-text-secondary md:px-2.5 md:py-1 md:text-[12px]"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.04] pt-4 md:mt-6">
        <div className="flex items-center gap-1">
          <BookOpen size={12} className="text-text-tertiary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            Tests <span className="text-white">{item.evidenceCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-emerald-500/60" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            OK <span className="text-emerald-400">{item.positiveEvidenceCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <History size={12} className="text-rose-500/60" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            Fail <span className="text-rose-400">{item.negativeEvidenceCount}</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            {item.lastDetectedAt ? (
              <>Last <span className="text-white">{new Date(item.lastDetectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></>
            ) : (
              "New"
            )}
          </span>
        </div>
      </div>
    </article>
  )
}
function GrammarStatusBadge({ item }: { item: GrammarSkillRecord }) {
  if (item.evidenceCount === 0) {
    return (
      <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/30 md:px-2 md:text-[10px]">
        No data
      </span>
    )
  }

  const bandStyles: Record<GrammarScoreBand, string> = {
    unknown: "bg-white/[0.06] text-white/30",
    minor: "bg-amber-500/10 text-amber-200",
    weak: "bg-rose-500/10 text-rose-200",
    serious: "bg-red-500/15 text-red-200",
    critical: "bg-red-500/25 text-red-100",
    strong: "bg-emerald-500/10 text-emerald-200"
  }

  const bandLabels: Record<GrammarScoreBand, string> = {
    unknown: "No data",
    minor: "Practice",
    weak: "Weak",
    serious: "Serious",
    critical: "Critical",
    strong: "Strong"
  }

  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider md:px-2 md:text-[10px] ${bandStyles[item.scoreBand]}`}>
      {bandLabels[item.scoreBand]}
    </span>
  )
}

function ScoreIndicator({ score }: { score: number }) {
  // Convert -100..100 to 0..100
  const percent = ((score + 100) / 200) * 100

  return (
    <div className="space-y-2 py-1 md:space-y-3 md:pt-2">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04] md:h-2">
        <div 
          className="absolute h-full rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${percent}%`,
            background: 'linear-gradient(to right, #ff453a, #ffd60a, #30d158)',
            boxShadow: '0 0 10px rgba(255,255,255,0.1)'
          }}
        />
        {/* Zero marker */}
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/20" />
      </div>
      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-text-tertiary md:text-[9px]">
        <span className={score <= -30 ? "text-rose-400" : ""}>Weak</span>
        <span className={score > -30 && score < 30 ? "text-amber-400" : ""}>Neutral</span>
        <span className={score >= 30 ? "text-emerald-400" : ""}>Strong</span>
      </div>
    </div>
  )
}

function EmptyEvidenceState() {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-3 text-center">
      <p className="text-[12px] leading-relaxed text-text-tertiary">
        No evidence yet. Complete a writing check to unlock this topic.
      </p>
    </div>
  )
}

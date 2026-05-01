"use client"

import React from "react"
import { ChevronDown, Search } from "lucide-react"
import type { CefrLevel } from "@/lib/types"
import type { GrammarFilterType, GrammarSortType } from "./GrammarView"

interface GrammarFiltersProps {
  search: string
  onSearchChange: (val: string) => void
  filter: GrammarFilterType
  onFilterChange: (val: GrammarFilterType) => void
  cefrFilter: CefrLevel | "all"
  onCefrFilterChange: (val: CefrLevel | "all") => void
  sort: GrammarSortType
  onSortChange: (val: GrammarSortType) => void
}

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

export function GrammarFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  cefrFilter,
  onCefrFilterChange,
  sort,
  onSortChange
}: GrammarFiltersProps) {
  const filterChips: Array<{ id: GrammarFilterType; label: string }> = [
    { id: "all", label: "All" },
    { id: "weak", label: "Weak" },
    { id: "learning", label: "Learning" },
    { id: "strong", label: "Strong" },
    { id: "no_data", label: "New" }
  ]

  return (
    <div className="flex flex-col gap-4 px-4 md:px-0">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
        <input 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search grammar topics..."
          className="h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-11 pr-4 text-[15px] font-medium text-white placeholder:text-white/20 focus:border-white/10 outline-none transition-all"
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="hide-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-white/[0.03] p-1 border border-white/5">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onFilterChange(chip.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${
                filter === chip.id 
                  ? "bg-white text-black shadow-lg" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 md:flex-none">
            <select
              value={cefrFilter}
              onChange={(e) => onCefrFilterChange(e.target.value as CefrLevel | "all")}
              className="h-10 w-full min-w-[100px] appearance-none rounded-xl border border-white/5 bg-white/[0.03] pl-3 pr-8 text-[13px] font-bold text-white outline-none"
            >
              <option value="all">Level: All</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>

          <div className="relative flex-1 md:flex-none">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as GrammarSortType)}
              className="h-10 w-full min-w-[140px] appearance-none rounded-xl border border-white/5 bg-white/[0.03] pl-3 pr-8 text-[13px] font-bold text-white outline-none"
            >
              <option value="priority">Recommended</option>
              <option value="weakest">Weakest first</option>
              <option value="recent">Recently detected</option>
              <option value="cefr">CEFR Level</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
        </div>
      </div>
    </div>
  )
}

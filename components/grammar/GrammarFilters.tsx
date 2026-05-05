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

const filterChips: { id: GrammarFilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "weak", label: "Weak" },
  { id: "learning", label: "Learning" },
  { id: "strong", label: "Strong" },
  { id: "no_data", label: "New" }
]

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
  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
        <input 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search grammar topics..."
          className="h-12 w-full rounded-[14px] border border-white/[0.05] bg-white/[0.05] pl-11 pr-4 text-[15px] font-medium text-white placeholder:text-white/20 focus:bg-white/[0.08] outline-none transition-all"
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Chips */}
        <div className="hide-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onFilterChange(chip.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-bold tracking-tight transition-all ${
                filter === chip.id 
                  ? "bg-white text-black shadow-lg" 
                  : "bg-white/5 text-white/40 border border-white/5 hover:text-white hover:bg-white/10"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Level and Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1 md:flex-none">
            <select
              value={cefrFilter}
              onChange={(e) => onCefrFilterChange(e.target.value as CefrLevel | "all")}
              className="h-10 w-full min-w-[100px] appearance-none rounded-xl border border-white/[0.05] bg-white/[0.05] pl-4 pr-9 text-[12px] font-bold text-white/60 outline-none"
            >
              <option value="all">All Levels</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/20" />
          </div>

          <div className="relative flex-1 md:flex-none">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as GrammarSortType)}
              className="h-10 w-full min-w-[130px] appearance-none rounded-xl border border-white/[0.05] bg-white/[0.05] pl-4 pr-9 text-[12px] font-bold text-white/60 outline-none"
            >
              <option value="priority">Recommended</option>
              <option value="weakest">Weakest First</option>
              <option value="recent">Recently Used</option>
              <option value="cefr">By Level</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}

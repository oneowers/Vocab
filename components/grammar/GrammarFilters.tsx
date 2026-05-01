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
    <div className="flex flex-col gap-2 px-4 md:px-0">
      {/* Search Input */}
      <div className="relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
        <input 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search topics..."
          className="h-9 w-full rounded-xl border border-white/5 bg-white/[0.03] pl-9 pr-4 text-[12px] font-medium text-white placeholder:text-white/10 focus:border-white/10 outline-none transition-all"
        />
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Chips */}
        <div className="hide-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onFilterChange(chip.id)}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === chip.id 
                  ? "bg-white text-black shadow-md" 
                  : "bg-white/5 text-white/30 border border-white/5 hover:text-white"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Level and Sort */}
        <div className="flex gap-1.5">
          <div className="relative flex-1 md:flex-none">
            <select
              value={cefrFilter}
              onChange={(e) => onCefrFilterChange(e.target.value as CefrLevel | "all")}
              className="h-7 w-full min-w-[70px] appearance-none rounded-lg border border-white/5 bg-white/5 pl-2 pr-6 text-[10px] font-black uppercase tracking-widest text-white/40 outline-none"
            >
              <option value="all">Level</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/10" />
          </div>

          <div className="relative flex-1 md:flex-none">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as GrammarSortType)}
              className="h-7 w-full min-w-[90px] appearance-none rounded-lg border border-white/5 bg-white/5 pl-2 pr-6 text-[10px] font-black uppercase tracking-widest text-white/40 outline-none"
            >
              <option value="priority">Priority</option>
              <option value="weakest">Weakest</option>
              <option value="recent">Recent</option>
              <option value="cefr">Level</option>
            </select>
            <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/10" />
          </div>
        </div>
      </div>
    </div>
  )
}

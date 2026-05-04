"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Volume2, Clock, Zap, Brain, History } from "lucide-react"
import { speakText } from "@/lib/tts"
import type { CardRecord } from "@/lib/types"
import { formatTimestamp } from "@/lib/date"

interface CardDetailsModalProps {
  card: CardRecord | null
  onClose: () => void
}

export function CardDetailsModal({ card, onClose }: CardDetailsModalProps) {
  if (!card) return null

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()
    speakText(card.original, card.direction === "en-ru" ? "en-US" : "ru-RU")
  }

  const retention = card.reviewCount > 0 
    ? Math.round((card.correctCount / card.reviewCount) * 100) 
    : 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0c10] shadow-2xl"
      >
        {/* Header/Close */}
        <div className="absolute right-6 top-6 z-10">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-[32px] font-black tracking-tight text-white">{card.original}</h2>
                <button
                  onClick={handleSpeak}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <p className="text-[20px] font-bold text-white/40">{card.translation}</p>
            </div>
            {card.cefrLevel && (
              <span className="rounded-xl bg-white/5 px-4 py-2 text-[14px] font-black uppercase tracking-widest text-white/60 border border-white/5">
                {card.cefrLevel}
              </span>
            )}
          </div>

          {card.phonetic && (
            <p className="mt-4 text-[17px] font-medium text-white/20">/{card.phonetic}/</p>
          )}

          {card.example && (
            <div className="mt-8 rounded-3xl bg-white/[0.03] p-6 border border-white/5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Example Usage</p>
              <p className="text-[16px] font-medium leading-relaxed text-white/80">{card.example}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.02] p-4 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-emerald-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white/20">Retention</span>
              </div>
              <p className="text-[20px] font-black text-white">{retention}%</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] p-4 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <History size={14} className="text-blue-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white/20">Reviews</span>
              </div>
              <p className="text-[20px] font-black text-white">{card.reviewCount}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] p-4 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white/20">Next Review</span>
              </div>
              <p className="text-[14px] font-black text-white/60">{formatTimestamp(card.nextReviewDate)}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] p-4 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-purple-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white/20">Level</span>
              </div>
              <p className="text-[14px] font-black text-white/60">{card.reviewCount >= 5 ? 'Mastered' : 'Learning'}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white/[0.02] border-t border-white/5 p-6 flex gap-3">
          <button
            onClick={() => window.location.href = `/practice?cardId=${card.id}`}
            className="flex-1 h-14 rounded-2xl bg-white text-black text-[15px] font-black uppercase tracking-wider hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Practice Now
          </button>
        </div>
      </motion.div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { CheckCircle2, Flame, Rocket, Sparkles, Zap, ArrowRight, ChevronRight, Target, Trophy, Clock, Star, TrendingUp, Menu, X } from "lucide-react"
import Link from "next/link"
import { AppleProgressCard, AppleTile, AppleListItem } from "./AppleDashboardComponents"
import type { AppUserRecord, CardsResponse } from "@/lib/types"

interface Task {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  accentColor: string
  progress: number
  target: number
  completed: boolean
  rewardXp: number
  time: string
}

interface HomeDashboardViewProps {
  user: AppUserRecord
  initialCardsData: CardsResponse | null
}

export function HomeDashboardView({ user, initialCardsData }: HomeDashboardViewProps) {
  const tasks: Task[] = [
    {
      id: "words",
      title: "Vocabulary Expansion",
      subtitle: "Learn 10 new words today",
      icon: <span className="text-[14px] font-bold">Aa</span>,
      color: "bg-[#0A84FF]",
      accentColor: "blue",
      progress: initialCardsData?.dailyCatalog?.claimedToday ?? 0,
      target: 10,
      completed: (initialCardsData?.dailyCatalog?.claimedToday ?? 0) >= 10,
      rewardXp: 50,
      time: "0/10"
    },
    {
      id: "writing",
      title: "Creative Writing",
      subtitle: "Short practice session",
      icon: <Sparkles size={18} />,
      color: "bg-[#BF5AF2]",
      accentColor: "purple",
      progress: 0,
      target: 1,
      completed: false,
      rewardXp: 40,
      time: "0/1"
    },
    {
      id: "quiz",
      title: "Knowledge Check",
      subtitle: "Quick proficiency quiz",
      icon: <Target size={18} />,
      color: "bg-[#FF9F0A]",
      accentColor: "orange",
      progress: 0,
      target: 1,
      completed: false,
      rewardXp: 30,
      time: "0/1"
    }
  ]

  const completedTasks = tasks.filter(t => t.completed).length
  const totalProgress = Math.round((completedTasks / tasks.length) * 100)
  const remainingXp = tasks.reduce((sum, t) => sum + (t.completed ? 0 : t.rewardXp), 0)

  // Animation variants for Apple-style spring
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  }

  return (
    <div className="mx-auto max-w-xl min-h-screen px-4 pb-32 pt-24 overflow-x-hidden bg-black">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* Progress Card (Storage style) */}
        <motion.section variants={itemVariants} className="px-1">
          <AppleProgressCard
            title="Daily Progress"
            current={completedTasks}
            total={tasks.length}
            href="/stats"
          />
        </motion.section>

        {/* Promo Banner (Get Apple Invites style) - Only show if not Pro/Admin */}
        {user.role !== "PRO" && user.role !== "ADMIN" && (
          <motion.section variants={itemVariants} className="px-1">
            <div className="bg-[#1C1C1E] rounded-[20px] p-4 relative overflow-hidden group border border-white/[0.03]">
              <button className="absolute top-4 right-4 text-white/20 hover:text-white/40 transition-colors">
                <X size={18} />
              </button>
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#FF9F0A] flex items-center justify-center text-white shadow-inner shadow-white/20">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <h3 className="text-[15px] font-bold tracking-tight text-white">Boost Your Learning</h3>
                  <p className="text-[12px] font-medium text-white/50 leading-snug">Unlock personalized AI coaching and unlimited practice.</p>
                  <button className="text-[14px] font-bold text-[#0A84FF] pt-1.5 flex items-center gap-1 group-active:opacity-60 transition-opacity">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Saved Grid (Saved to iCloud style) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#34C759]" />
              <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.05em]">
                YOUR MISSION
              </h3>
            </div>
            <button className="text-[13px] font-semibold text-[#0A84FF] flex items-center active:opacity-60 transition-opacity">
              See All <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 px-1">
            {tasks.map((task) => (
              <AppleTile
                key={task.id}
                title={task.title.split(' ')[0]}
                subtitle={`${task.time} Completed`}
                icon={task.icon}
                color={task.color}
                href="/practice"
              />
            ))}
            <AppleTile
              title="Grammar"
              subtitle="12 Rules"
              icon={<Sparkles size={16} />}
              color="bg-[#5E5CE6]"
              href="/grammar"
            />
          </div>
        </section>

        {/* Bottom List Items (Backup style) */}
        <motion.section variants={itemVariants} className="px-1">
          <div className="bg-[#1C1C1E] rounded-[20px] overflow-hidden border border-white/[0.03]">
            <AppleListItem
              title="Learning Goal"
              subtitle="Learn 10 words today"
              icon={<Target size={18} />}
              iconColor="bg-[#0A84FF]"
              href="/stats"
              rightLabel="Daily"
              showDivider={true}
            />
            <AppleListItem
              title="Keep Streak"
              subtitle="Consistency is key"
              icon={<Flame size={18} />}
              iconColor="bg-[#34C759]"
              href="/stats"
              rightLabel="1d"
            />
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}



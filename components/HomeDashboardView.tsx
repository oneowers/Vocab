"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { CheckCircle2, Flame, Rocket, Sparkles, Zap, ArrowRight, ChevronRight, Target, Trophy, Clock, Star, TrendingUp, Menu, X } from "lucide-react"
import Link from "next/link"
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
    <div className="mx-auto max-w-xl min-h-screen px-4 pb-32 pt-20 overflow-x-hidden bg-black">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* Progress Card (Storage style) */}
        <motion.section variants={itemVariants} className="px-1">
          <Link href="/stats" className="bg-[#1C1C1E] rounded-[20px] p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform border border-white/[0.03]">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold tracking-tight text-white">Daily Progress</span>
              <div className="flex items-center text-white/30">
                <span className="text-[13px] font-medium mr-1">{completedTasks} of {tasks.length} tasks</span>
                <ChevronRight size={16} />
              </div>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[#34C759] rounded-full"
              />
            </div>
          </Link>
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
              <Link
                key={task.id}
                href="/practice"
                className="bg-[#1C1C1E] rounded-[20px] p-3.5 flex flex-col gap-2.5 active:scale-[0.97] transition-all border border-white/[0.03]"
              >
                <div className={`h-9 w-9 flex items-center justify-center rounded-lg ${task.color} text-white shadow-inner shadow-white/10`}>
                  {task.icon}
                </div>
                <div className="space-y-0">
                  <p className="text-[15px] font-bold tracking-tight text-white truncate">{task.title.split(' ')[0]}</p>
                  <p className="text-[12px] font-medium text-white/30">{task.time} Completed</p>
                </div>
              </Link>
            ))}
            <Link
              href="/grammar"
              className="bg-[#1C1C1E] rounded-[20px] p-3.5 flex flex-col gap-2.5 active:scale-[0.97] transition-all border border-white/[0.03]"
            >
              <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#5E5CE6] text-white shadow-inner shadow-white/10">
                <Sparkles size={16} />
              </div>
              <div className="space-y-0">
                <p className="text-[15px] font-bold tracking-tight text-white">Grammar</p>
                <p className="text-[12px] font-medium text-white/30">12 Rules</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Bottom List Items (Backup style) */}
        <motion.section variants={itemVariants} className="px-1">
          <div className="bg-[#1C1C1E] rounded-[20px] overflow-hidden divide-y divide-white/[0.05] border border-white/[0.03]">
            <Link href="/stats" className="flex items-center justify-between p-3.5 px-4 active:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-md bg-[#0A84FF] flex items-center justify-center text-white">
                  <Target size={14} />
                </div>
                <span className="text-[15px] font-semibold text-white">Learning Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-white/20 font-medium">Daily</span>
                <ChevronRight size={16} className="text-white/10" />
              </div>
            </Link>
            <Link href="/stats" className="flex items-center justify-between p-3.5 px-4 active:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-md bg-[#34C759] flex items-center justify-center text-white">
                  <Flame size={14} />
                </div>
                <span className="text-[15px] font-semibold text-white">Keep Streak</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-white/20 font-medium">1d</span>
                <ChevronRight size={16} className="text-white/10" />
              </div>
            </Link>
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}



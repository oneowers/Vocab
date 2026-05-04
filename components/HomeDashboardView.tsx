"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Flame, Rocket, Sparkles, Zap, ArrowRight } from "lucide-react"
import type { AppUserRecord, CardsResponse } from "@/lib/types"

interface Task {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  progress: number
  target: number
  completed: boolean
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
      icon: <span className="text-[16px] font-black">Aa</span>,
      color: "bg-white text-black",
      progress: initialCardsData?.dailyCatalog?.claimedToday ?? 0,
      target: 10,
      completed: (initialCardsData?.dailyCatalog?.claimedToday ?? 0) >= 10
    },
    {
      id: "writing",
      title: "Creative Writing",
      subtitle: "Short practice session",
      icon: <Sparkles size={18} />,
      color: "bg-white/[0.05] text-white",
      progress: 0,
      target: 1,
      completed: false
    },
    {
      id: "quiz",
      title: "Knowledge Check",
      subtitle: "Quick proficiency quiz",
      icon: <Zap size={18} />,
      color: "bg-white/[0.05] text-white",
      progress: 0,
      target: 1,
      completed: false
    }
  ]

  const completedTasks = tasks.filter(t => t.completed).length
  const totalProgress = Math.round((completedTasks / tasks.length) * 100)

  return (
    <div className="mx-auto max-w-xl min-h-screen px-6 pb-40 pt-12 bg-black selection:bg-white selection:text-black">
      {/* Header Section */}
      <header className="relative mb-12">
        <span suppressHydrationWarning className="text-[14px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
        <h1 className="text-[48px] font-black tracking-[-0.04em] text-white leading-[0.95] mb-8">
          Today’s<br />Mission
        </h1>
        
        <div className="flex items-center gap-8">
          <div className="relative h-28 w-28">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-white/[0.05]"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              <motion.circle
                className="text-white"
                strokeWidth="8"
                strokeDasharray={263.89}
                initial={{ strokeDashoffset: 263.89 }}
                animate={{ strokeDashoffset: 263.89 - (263.89 * totalProgress) / 100 }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-black text-white">{totalProgress}%</span>
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-[16px] font-medium text-white/40 leading-relaxed max-w-[180px]">
              You've completed {completedTasks} out of {tasks.length} tasks for today.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-white/[0.03] rounded-[32px] p-6 border border-white/[0.05] backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-white/20 uppercase tracking-wider">Streak</span>
            <Flame size={16} className="text-orange-500/80" />
          </div>
          <p className="text-[32px] font-black text-white leading-none">
            {user.streak}<span className="text-[14px] text-white/10 ml-1 font-bold">days</span>
          </p>
        </div>
        
        <div className="bg-white/[0.03] rounded-[32px] p-6 border border-white/[0.05] backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-white/20 uppercase tracking-wider">Today</span>
            <Sparkles size={16} className="text-blue-500/80" />
          </div>
          <p className="text-[32px] font-black text-white leading-none">
            +120<span className="text-[14px] text-white/10 ml-1 font-bold">xp</span>
          </p>
        </div>
      </section>

      {/* Task List */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-[20px] font-black text-white">Your Schedule</h2>
          <span className="text-[13px] font-bold text-white/20">{tasks.length} active tasks</span>
        </div>
        
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className="group bg-white/[0.02] rounded-[32px] p-5 border border-white/[0.05] transition-all hover:bg-white/[0.04] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${task.color} shadow-2xl`}>
                    {task.icon}
                  </div>
                  <div>
                    <h4 className="text-[17px] font-bold text-white">{task.title}</h4>
                    <p className="text-[14px] font-medium text-white/30">{task.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {task.completed ? (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black">
                      <CheckCircle2 size={20} />
                    </div>
                  ) : (
                    <div className="text-[13px] font-black text-white/20 px-3 py-1 bg-white/[0.03] rounded-full border border-white/5">
                      {task.progress}/{task.target}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <div className="fixed bottom-32 left-0 right-0 px-6 pointer-events-none md:static md:px-0 md:bottom-0">
        <button 
          onClick={() => window.location.href = "/practice"}
          className="pointer-events-auto h-20 w-full bg-white text-black rounded-[32px] flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(255,255,255,0.05)] transition-all hover:bg-white/90 active:scale-[0.97]"
        >
          <span className="text-[18px] font-black tracking-tight">START SESSION</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}

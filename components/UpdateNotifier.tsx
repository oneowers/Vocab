"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Info, RefreshCw, X } from "lucide-react"

export function UpdateNotifier() {
  const [show, setShow] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)

  useEffect(() => {
    // 1. Get initial version on mount
    async function checkVersion() {
      try {
        const res = await fetch("/api/version")
        if (!res.ok) return
        const data = await res.json()
        
        if (!currentVersion) {
          setCurrentVersion(data.version)
        } else if (currentVersion !== data.version) {
          setShow(true)
        }
      } catch (e) {
        // Silently fail
      }
    }

    checkVersion()

    // 2. Poll every 5 minutes
    const interval = setInterval(checkVersion, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [currentVersion])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 z-[100] w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2"
        >
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#16161b]/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/40">
                <Info size={20} />
              </div>
              
              <div className="flex-1 space-y-1">
                <h3 className="text-[16px] font-black tracking-tight text-white">
                  A new version is available
                </h3>
                <p className="text-[14px] font-medium leading-relaxed text-white/40">
                  Refresh to see the latest changes and improvements.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShow(false)}
                className="h-11 rounded-xl px-4 text-[14px] font-bold text-white/30 transition hover:bg-white/5 hover:text-white/60"
              >
                Not now
              </button>
              <button
                onClick={handleRefresh}
                className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-6 text-[14px] font-black text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition hover:bg-emerald-400 active:scale-[0.98]"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {/* Close icon */}
            <button 
              onClick={() => setShow(false)}
              className="absolute right-4 top-4 text-white/20 hover:text-white/50"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

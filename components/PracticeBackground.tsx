"use client"

import { motion, AnimatePresence } from "framer-motion"

interface PracticeBackgroundProps {
  status: "idle" | "correct" | "incorrect" | "active"
}

export function PracticeBackground({ status }: PracticeBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Nebula Aurora Layer 1 */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.6, 0.4],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
            className={`absolute -top-1/4 -left-1/4 h-[150%] w-[150%] rounded-[100%] blur-[140px] transition-colors duration-1000 ${
              status === "correct"
                ? "bg-emerald-500/15"
                : status === "incorrect"
                ? "bg-rose-500/15"
                : status === "active"
                ? "bg-indigo-600/15"
                : "bg-blue-600/10"
            }`}
          />

          {/* Nebula Aurora Layer 2 */}
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className={`absolute -bottom-1/4 -right-1/4 h-[150%] w-[150%] rounded-[100%] blur-[140px] transition-colors duration-1000 ${
              status === "correct"
                ? "bg-emerald-400/10"
                : status === "incorrect"
                ? "bg-rose-600/10"
                : status === "active"
                ? "bg-violet-600/10"
                : "bg-purple-600/10"
            }`}
          />
          
          {/* Nebula Aurora Layer 3 (Core) */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute top-1/4 left-1/4 h-[50%] w-[50%] rounded-[100%] blur-[100px] transition-colors duration-1000 mix-blend-screen ${
              status === "correct"
                ? "bg-teal-400/20"
                : status === "incorrect"
                ? "bg-orange-500/15"
                : "bg-fuchsia-500/15"
            }`}
          />
        </motion.div>
      </AnimatePresence>

      {/* Static Noise Texture for Depth */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3 ForeignObject %3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  )
}

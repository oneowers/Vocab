"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"

interface AppleAlertProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function AppleAlert({ 
  open, 
  onClose, 
  title, 
  message,
  primaryAction,
  secondaryAction 
}: AppleAlertProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Alert Card */}
          <motion.div
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[270px] bg-[#1c1c1e]/90 backdrop-blur-2xl rounded-[14px] overflow-hidden flex flex-col shadow-2xl border border-white/[0.05]"
          >
            <div className="p-4 flex flex-col items-center text-center">
              <h2 className="text-[17px] font-semibold text-white leading-tight">
                {title}
              </h2>
              <p className="mt-1 text-[13px] text-white/90 leading-snug">
                {message}
              </p>
            </div>

            <div className="flex border-t border-white/10 h-11">
              {secondaryAction ? (
                <>
                  <button
                    onClick={secondaryAction.onClick}
                    className="flex-1 text-[17px] font-normal text-[#0A84FF] active:bg-white/5 transition-colors"
                  >
                    {secondaryAction.label}
                  </button>
                  <div className="w-[1px] bg-white/10 h-full" />
                  <button
                    onClick={primaryAction?.onClick || onClose}
                    className="flex-1 text-[17px] font-semibold text-[#0A84FF] active:bg-white/5 transition-colors"
                  >
                    {primaryAction?.label || "OK"}
                  </button>
                </>
              ) : (
                <button
                  onClick={primaryAction?.onClick || onClose}
                  className="flex-1 text-[17px] font-semibold text-[#0A84FF] active:bg-white/5 transition-colors"
                >
                  {primaryAction?.label || "OK"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

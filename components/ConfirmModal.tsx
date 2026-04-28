"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
  loading = false
}: ConfirmModalProps) {
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onCancel, open])

  if (!mounted) {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/28 px-4 backdrop-blur-md md:flex md:items-center md:justify-center"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="panel m-3 fixed inset-x-0 bottom-0 max-w-lg rounded-t-sheet border-b-0 p-5 md:static md:rounded-[20px] md:border md:p-6"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 96 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 72 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.01,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line md:hidden" />
            <h2 className="text-[22px] font-bold tracking-[-0.5px] text-ink">{title}</h2>
            <p className="mt-3 text-[15px] leading-6 text-muted">{description}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onCancel} className="button-secondary">
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="button-destructive"
              >
                {loading ? "Working..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
    ,
    document.body
  )
}

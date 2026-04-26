"use client"

import { createContext, useContext, useEffect, useState } from "react"

type ToastTone = "info" | "success" | "error"

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function showToast(message: string, tone: ToastTone = "info") {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, { id, message, tone }])
  }

  useEffect(() => {
    if (!toasts.length) {
      return
    }

    const timeout = window.setTimeout(() => {
      setToasts((current) => current.slice(1))
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [toasts])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-[calc(var(--tab-bar-height)+16px)] right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3 md:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-[18px] border px-4 py-3 text-[15px] shadow-panel backdrop-blur-xl animate-slide-in ${
              toast.tone === "success"
                ? "border-line bg-successBg text-successText"
                : toast.tone === "error"
                  ? "border-line bg-dangerBg text-dangerText"
                  : "border-line bg-background-primary/90 text-ink"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.")
  }

  return context
}

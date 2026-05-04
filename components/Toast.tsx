"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AppleAlert } from "@/components/AppleAlert"

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
  const [activeError, setActiveError] = useState<string | null>(null)

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    if (tone === "error") {
      setActiveError(message)
    } else {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setToasts((current) => [...current, { id, message, tone }])
    }
  }, [])

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  useEffect(() => {
    if (!toasts.length) {
      return
    }

    const timeout = window.setTimeout(() => {
      setToasts((current) => current.slice(1))
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [toasts])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* iOS Style Alert for Errors */}
      <AppleAlert 
        open={!!activeError}
        onClose={() => setActiveError(null)}
        title="Attention"
        message={activeError || ""}
        primaryAction={{
          label: "OK",
          onClick: () => setActiveError(null)
        }}
      />

      {/* Non-intrusive Toasts for Info/Success */}
      <div className="pointer-events-none fixed bottom-[calc(var(--tab-bar-height)+16px)] right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3 md:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-[18px] border px-4 py-3 text-[15px] shadow-panel backdrop-blur-xl animate-slide-in ${
              toast.tone === "success"
                ? "border-line bg-successBg text-successText"
                : "border-line bg-bg-primary/90 text-ink"
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

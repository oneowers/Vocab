"use client"

import { useEffect } from "react"

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error caught:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-8 text-center bg-shell text-ink">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
      <p className="mb-8 text-text-secondary">{error.message}</p>
      <button
        onClick={() => reset()}
        className="button-primary px-6 py-3 font-medium"
      >
        Try again
      </button>
    </div>
  )
}

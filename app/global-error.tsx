"use client"

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-shell text-ink">
        <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Global Error</h2>
          <p className="mb-8 text-text-secondary">{error.message}</p>
          <button onClick={() => reset()} className="button-primary px-6 py-3 font-medium">Try again</button>
        </div>
      </body>
    </html>
  )
}

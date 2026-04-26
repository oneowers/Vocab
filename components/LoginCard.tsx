"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useToast } from "@/components/Toast"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { getGuestCards, setGuestSessionActive } from "@/lib/guest"

interface LoginCardProps {
  guestModeEnabled: boolean
}

export function LoginCard({ guestModeEnabled }: LoginCardProps) {
  const [loading, setLoading] = useState<"google" | "guest" | null>(null)
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    router.prefetch("/dashboard")
  }, [router])

  async function handleGoogleSignIn() {
    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      showToast("Supabase is not configured yet.", "error")
      return
    }

    setLoading("google")

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    })

    if (error) {
      setLoading(null)
      showToast(error.message, "error")
    }
  }

  function handleGuestContinue() {
    setLoading("guest")
    setGuestSessionActive(true)
    getGuestCards()
    router.push("/dashboard")
  }

  return (
    <div className="panel mx-auto w-full max-w-lg rounded-[2rem] p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-ink text-2xl font-semibold text-white">
        W
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.32em] text-quiet">
        WordFlow
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-ink">Learn words with rhythm.</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        Translate vocabulary, build your deck, and return every day for spaced repetition.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={guestModeEnabled || loading !== null}
          className="button-primary px-5 py-4 text-sm font-medium"
        >
          {loading === "google" ? "Redirecting..." : "Continue with Google"}
        </button>
        {!guestModeEnabled ? null : (
          <button
            type="button"
            onClick={handleGuestContinue}
            disabled={loading !== null}
            className="button-secondary px-5 py-4 text-sm font-medium"
          >
            {loading === "guest" ? "Opening..." : "Continue as Guest"}
          </button>
        )}
      </div>

      {guestModeEnabled ? (
        <p className="mt-4 text-sm text-quiet">
          Guest mode — your progress will not be saved.
        </p>
      ) : null}
    </div>
  )
}

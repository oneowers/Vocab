"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useToast } from "@/components/Toast"
import { hasSupabaseEnv } from "@/lib/config"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { getGuestCards, setGuestSessionActive } from "@/lib/guest"

interface LoginCardProps {
  guestModeEnabled: boolean
}

export function LoginCard({ guestModeEnabled }: LoginCardProps) {
  const [loading, setLoading] = useState<"google" | "guest" | null>(null)
  const router = useRouter()
  const { showToast } = useToast()
  const supabaseEnabled = hasSupabaseEnv()

  useEffect(() => {
    router.prefetch("/")
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
    router.push("/")
  }

  return (
    <div className="panel mx-auto w-full max-w-lg p-8 text-center">
      <div className="brand-mark mx-auto h-16 w-16 text-2xl font-semibold">
        W
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.32em] text-quiet">
        WordFlow
      </p>
      <h1 className="mt-3 text-[34px] font-bold tracking-[-0.5px] text-text-primary">
        Learn words with rhythm.
      </h1>
      <p className="mt-4 text-[15px] leading-6 text-text-secondary">
        Translate vocabulary, build your deck, and return every day for spaced repetition.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={!supabaseEnabled || loading !== null}
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
        <p className="mt-4 text-[15px] text-text-tertiary">
          Guest mode — your progress will not be saved.
        </p>
      ) : null}
      {!supabaseEnabled ? (
        <p className="mt-2 text-[15px] text-text-tertiary">
          Local mode: you can continue as a guest without registration.
        </p>
      ) : null}
    </div>
  )
}

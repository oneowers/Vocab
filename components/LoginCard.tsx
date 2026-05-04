"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { BrandLogo } from "@/components/BrandLogo"
import { useToast } from "@/components/Toast"
import { hasSupabaseEnv, isLocalDevelopment } from "@/lib/config"
import { createSupabaseBrowserClient } from "@/lib/supabase"

type Mode = "login" | "register"

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.6 24.5c0-1.5-.1-2.9-.4-4.2H24v7.9h11c-.5 2.5-1.9 4.6-4 6v5h6.4c3.8-3.5 6.2-8.6 6.2-14.7z" fill="#4285F4" />
      <path d="M24 44c5.4 0 10-1.8 13.3-4.9l-6.4-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5v5.2C8.3 39.1 15.6 44 24 44z" fill="#34A853" />
      <path d="M12.6 27.6c-.4-1.2-.6-2.4-.6-3.6s.2-2.4.6-3.6V15.2H5C3.7 17.8 3 20.8 3 24s.7 6.2 2 8.8l7.6-5.2z" fill="#FBBC05" />
      <path d="M24 10c3 0 5.7 1 7.8 3l5.8-5.8C34 3.8 29.4 2 24 2 15.6 2 8.3 6.9 5 13.2l7.6 5.2c1.6-4.8 6.1-8.4 11.4-8.4z" fill="#EA4335" />
    </svg>
  )
}

export function LoginCard() {
  const router = useRouter()
  const { showToast } = useToast()
  const supabaseEnabled = hasSupabaseEnv()

  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState<"google" | "email" | null>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; form?: string }>({})

  useEffect(() => {
    router.prefetch("/")
  }, [router])

  function validate() {
    const next: typeof errors = {}
    if (!email.trim()) next.email = "Email is required"
    else if (!validateEmail(email)) next.email = "Enter a valid email address"
    if (!password) next.password = "Password is required"
    else if (password.length < 8) next.password = "Password must be at least 8 characters"
    if (mode === "register" && password !== confirmPassword) next.confirm = "Passwords do not match"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading("email")
    setErrors({})

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ form: data.message || "Something went wrong" })
        return
      }

      if (mode === "register") {
        showToast("Account created! Signing you in…", "success")
      }

      if (data.useSupabase) {
        // Supabase session created server-side, just navigate
        router.push(data.redirectTo ?? "/")
        router.refresh()
        return
      }

      // For email/password fallback login, call Supabase client-side if available
      const supabase = createSupabaseBrowserClient()
      if (supabase && mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        })
        if (!error) {
          router.push(data.redirectTo ?? "/")
          router.refresh()
          return
        }
      }

      // Supabase not available or failed — cookie session was set server-side
      router.push(data.redirectTo ?? "/")
      router.refresh()

    } catch {
      setErrors({ form: "Network error. Please try again." })
    } finally {
      setLoading(null)
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      showToast("Google login is not configured yet.", "error")
      return
    }
    setLoading("google")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    })
    if (error) {
      setLoading(null)
      showToast(error.message, "error")
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    setEmail("")
    setPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="mx-auto w-full max-w-md px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="brand-mark mb-4 h-14 w-14 text-xl font-semibold">
          <BrandLogo />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted">LexiFlow</p>
        <h1 className="mt-2 text-[28px] font-black tracking-tight text-ink md:text-[32px]">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-2 text-[14px] text-muted">
          {mode === "login"
            ? "Sign in to continue learning"
            : "Start your vocabulary journey"}
        </p>
      </div>

      {/* Form */}
      <div className="panel p-6">
        <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, form: undefined })) }}
              placeholder="you@example.com"
              className={`w-full rounded-[14px] border bg-bg-secondary px-4 py-3 text-[15px] font-medium text-ink outline-none transition placeholder:text-muted/40 focus:border-accent/60 focus:bg-bg-tertiary ${errors.email ? "border-rose-500/60" : "border-line"}`}
            />
            {errors.email && (
              <p className="mt-1.5 text-[12px] font-medium text-rose-400">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-[12px] font-bold uppercase tracking-wider text-muted">
                Password
              </label>
              {mode === "login" && (
                <span className="text-[12px] font-medium text-muted/60">
                  8+ characters required
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined, form: undefined })) }}
                placeholder="••••••••"
                className={`w-full rounded-[14px] border bg-bg-secondary px-4 py-3 pr-11 text-[15px] font-medium text-ink outline-none transition placeholder:text-muted/40 focus:border-accent/60 focus:bg-bg-tertiary ${errors.password ? "border-rose-500/60" : "border-line"}`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-muted transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-[12px] font-medium text-rose-400">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password (register only) */}
          {mode === "register" && (
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })) }}
                  placeholder="••••••••"
                  className={`w-full rounded-[14px] border bg-bg-secondary px-4 py-3 pr-11 text-[15px] font-medium text-ink outline-none transition placeholder:text-muted/40 focus:border-accent/60 focus:bg-bg-tertiary ${errors.confirm ? "border-rose-500/60" : "border-line"}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-muted transition"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirm && (
                <p className="mt-1.5 text-[12px] font-medium text-rose-400">{errors.confirm}</p>
              )}
            </div>
          )}

          {/* Form-level error */}
          {errors.form && (
            <div className="rounded-[12px] border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-[13px] font-medium text-rose-400">
              {errors.form}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id={mode === "login" ? "login-submit" : "register-submit"}
            disabled={loading !== null}
            className="flex h-12 w-full items-center justify-center rounded-[14px] bg-ink text-[15px] font-black text-bg-primary transition hover:opacity-90 disabled:opacity-45"
          >
            {loading === "email" ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary/20 border-t-bg-primary" />
                {mode === "login" ? "Signing in…" : "Creating account…"}
              </span>
            ) : (
              mode === "login" ? "Log in" : "Create account"
            )}
          </button>
        </form>

        {/* Divider + Social */}
        {supabaseEnabled && (
          <>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-muted/50">or</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              id="google-login-btn"
              onClick={handleGoogleSignIn}
              disabled={loading !== null}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-line bg-bg-secondary text-[15px] font-bold text-ink transition hover:bg-bg-tertiary disabled:opacity-45"
            >
              {loading === "google" ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted/20 border-t-muted" />
                  Redirecting…
                </span>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>
          </>
        )}

        {/* Local dev */}
        {isLocalDevelopment() && (
          <button
            type="button"
            onClick={() => router.push("/api/auth/dev-login")}
            className="mt-3 flex h-11 w-full items-center justify-center rounded-[14px] border border-line/50 bg-bg-secondary/50 text-[13px] font-bold text-muted transition hover:bg-bg-tertiary"
          >
            Login as Admin (Local)
          </button>
        )}
      </div>

      {/* Switch mode */}
      <p className="mt-5 text-center text-[14px] text-muted">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              id="switch-to-register"
              onClick={() => switchMode("register")}
              className="font-bold text-ink hover:underline"
            >
              Create account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              id="switch-to-login"
              onClick={() => switchMode("login")}
              className="font-bold text-ink hover:underline"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  )
}

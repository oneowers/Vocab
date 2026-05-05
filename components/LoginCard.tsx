"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, User as UserIcon, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { BrandLogo } from "@/components/BrandLogo"
import { useToast } from "@/components/Toast"
import { AppleAlert } from "@/components/AppleDashboardComponents"
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

export function LoginCard({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter()
  const { showToast } = useToast()
  const supabaseEnabled = hasSupabaseEnv()

  const [mode, setMode] = useState<Mode>(initialMode)
  const [showSheet, setShowSheet] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState<"google" | "email" | null>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; form?: string }>({})
  const [errorAlert, setErrorAlert] = useState<{ title: string, message: string } | null>(null)

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
        setErrorAlert({ title: "Auth Failed", message: data.message || "Invalid credentials." })
        return
      }

      if (mode === "register") {
        showToast("Account created! Signing you in…", "success")
      }

      if (data.useSupabase) {
        window.location.href = data.redirectTo ?? "/"
        return
      }

      const supabase = createSupabaseBrowserClient()
      if (supabase && mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        })
        if (!error) {
          window.location.href = data.redirectTo ?? "/"
          return
        }
      }

      window.location.href = data.redirectTo ?? "/"
    } catch (err) {
      setErrorAlert({ title: "System Error", message: "Network error or server unavailable." })
    } finally {
      setLoading(null)
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      setErrorAlert({ 
        title: "Configuration Error", 
        message: "Google login is not configured yet." 
      })
      return
    }
    setLoading("google")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    })
    if (error) {
      setLoading(null)
      setErrorAlert({ title: "Sign-In Error", message: error.message })
    }
  }

  const openAuth = (m: Mode) => {
    setMode(m)
    setErrors({})
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setShowSheet(true)
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[80vh] px-6">
      {/* Landing State */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center space-y-12 max-w-sm"
      >
        <div className="h-24 w-24 rounded-[22%] bg-white p-5 shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
          <BrandLogo />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-[42px] font-black tracking-tight text-white leading-none">LexiFlow</h1>
          <p className="text-[17px] text-white/40 font-medium leading-snug">
            Master your vocabulary with premium iOS-native tools.
          </p>
        </div>

        <div className="w-full space-y-3 pt-8">
          <button
            onClick={() => openAuth("login")}
            className="w-full h-14 rounded-2xl bg-[#0A84FF] text-white text-[17px] font-bold active:scale-[0.98] transition-all shadow-lg"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuth("register")}
            className="w-full h-14 rounded-2xl bg-white/[0.08] text-white text-[17px] font-bold active:scale-[0.98] transition-all"
          >
            Create Account
          </button>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="flex items-center gap-3 text-[14px] text-white/30 font-bold hover:text-white transition-colors pt-4"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </motion.div>

      {/* Auth Bottom Sheet */}
      <AnimatePresence>
        {showSheet && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 350 }}
              className="relative w-full max-w-[420px] bg-[#1C1C1E] rounded-t-[36px] sm:rounded-[36px] flex flex-col max-h-[90vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/[0.05]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6">
                <div className="w-8" />
                <div className="h-14 w-14 rounded-full border-[3px] border-[#0A84FF] flex items-center justify-center">
                  <UserIcon size={24} className="text-[#0A84FF]" fill="currentColor" fillOpacity={0.1} />
                </div>
                <button 
                  onClick={() => setShowSheet(false)}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-8 pb-12 overflow-y-auto">
                <div className="text-center space-y-2 mb-10">
                  <h2 className="text-[28px] font-bold text-white tracking-tight">
                    {mode === "login" ? "Welcome Back" : "New Account"}
                  </h2>
                  <p className="text-[15px] text-white/40 leading-snug px-6">
                    {mode === "login" 
                      ? "Sign in to access your vocabulary and progress." 
                      : "Start your learning journey with a native experience."}
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="bg-white/5 rounded-[22px] overflow-hidden border border-white/[0.05]">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full h-14 bg-transparent px-5 text-white placeholder:text-white/20 outline-none text-[17px]"
                    />
                    <div className="h-[0.5px] bg-white/[0.08] ml-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-14 bg-transparent px-5 text-white placeholder:text-white/20 outline-none text-[17px]"
                    />
                    {mode === "register" && (
                      <>
                        <div className="h-[0.5px] bg-white/[0.08] ml-5" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm Password"
                          className="w-full h-14 bg-transparent px-5 text-white placeholder:text-white/20 outline-none text-[17px]"
                        />
                      </>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading !== null}
                    className="w-full h-14 rounded-2xl bg-[#0A84FF] text-white text-[17px] font-bold active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
                  >
                    {loading === "email" ? "Processing..." : "Continue"}
                  </button>
                  
                  {mode === "login" ? (
                    <button 
                      type="button"
                      onClick={() => setMode("register")}
                      className="w-full text-[14px] font-bold text-white/30 hover:text-white transition-colors"
                    >
                      Need an account? Sign Up
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setMode("login")}
                      className="w-full text-[14px] font-bold text-white/30 hover:text-white transition-colors"
                    >
                      Already have an account? Sign In
                    </button>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AppleAlert 
        isOpen={Boolean(errorAlert)}
        onClose={() => setErrorAlert(null)}
        title={errorAlert?.title || "Error"}
        message={errorAlert?.message || ""}
      />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

import { GuestBanner } from "@/components/GuestBanner"
import { TranslatorPanel } from "@/components/TranslatorPanel"
import { isGuestSessionActive } from "@/lib/guest"

export function DashboardView() {
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setGuestMode(isGuestSessionActive())
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="translate-page-shell -mx-4 -my-4 px-4 py-5 md:-mx-8 md:-my-8 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <div className="skeleton h-11 rounded-[22px]" />
          <div className="skeleton min-h-[34rem] rounded-[28px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="translate-page-shell -mx-4 -my-4 px-4 py-5 md:-mx-8 md:-my-8 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
        <TranslatorPanel guestMode={guestMode} onAddCard={() => { }} />

        <GuestBanner />
      </div>
    </div>
  )
}

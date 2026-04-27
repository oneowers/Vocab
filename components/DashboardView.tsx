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
      <div className="space-y-4">
        <div className="skeleton h-11 rounded-card" />
        <div className="skeleton min-h-[28rem] rounded-[20px]" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <TranslatorPanel guestMode={guestMode} onAddCard={() => {}} />

        <GuestBanner />
      </div>
    </>
  )
}

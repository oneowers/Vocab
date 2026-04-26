"use client"

import { useEffect, useState } from "react"

import { isGuestSessionActive } from "@/lib/guest"

export function GuestBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(isGuestSessionActive())
  }, [])

  if (!visible) {
    return null
  }

  return (
    <div className="rounded-card border border-separator bg-guestBg px-4 py-3 text-[15px] text-guestText">
      You are in guest mode. Sign in with Google to save your progress.
    </div>
  )
}

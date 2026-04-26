import { redirect } from "next/navigation"

import { StatsView } from "@/components/StatsView"
import { requireSignedInAppUser } from "@/lib/auth"
import { canViewStats } from "@/lib/roles"

export default async function StatsPage() {
  const user = await requireSignedInAppUser()

  if (!user || !canViewStats(user.role)) {
    redirect("/profile")
  }

  return <StatsView />
}

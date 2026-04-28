import { redirect } from "next/navigation"

import { StatsView } from "@/components/StatsView"
import { requireSignedInAppUser } from "@/lib/auth"
import { canViewStats } from "@/lib/roles"
import { getUserStatsData } from "@/lib/server-data"

export default async function StatsPage() {
  const user = await requireSignedInAppUser()

  if (!user || !canViewStats(user.role)) {
    redirect("/profile")
  }

  const initialData = await getUserStatsData(user.id)

  return <StatsView initialData={initialData} />
}

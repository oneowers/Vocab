import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { canViewStats } from "@/lib/roles"
import { getDetailedUserStatsData } from "@/lib/server-data"

export async function GET(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!canViewStats(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const daysParam = request.nextUrl.searchParams.get("days")
  const parsedDays = Number.parseInt(daysParam || "7", 10)
  const daysCount = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 7

  return NextResponse.json(await getDetailedUserStatsData(user.id, daysCount))
}

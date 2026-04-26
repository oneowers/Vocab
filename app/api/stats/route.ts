import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { canViewStats } from "@/lib/roles"
import { buildUserStats } from "@/lib/server-data"

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!canViewStats(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(await buildUserStats(user.id))
}

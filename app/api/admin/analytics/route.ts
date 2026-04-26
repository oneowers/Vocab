import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { buildAdminAnalytics } from "@/lib/server-data"

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(await buildAdminAnalytics())
}

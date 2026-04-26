import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { buildUserStats } from "@/lib/server-data"

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(await buildUserStats(user.id))
}


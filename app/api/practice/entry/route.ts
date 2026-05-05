import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPracticeEntryData } from "@/lib/server-data"

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(await getPracticeEntryData(user.id))
}

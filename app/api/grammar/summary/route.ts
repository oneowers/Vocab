import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getUserGrammarSummaryData } from "@/lib/grammar"

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(await getUserGrammarSummaryData(user.id))
}

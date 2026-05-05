import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getUserGrammarTopicsData } from "@/lib/grammar"

export async function GET(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const scope = request.nextUrl.searchParams.get("scope") === "weak" ? "weak" : "all"

  return NextResponse.json(await getUserGrammarTopicsData(user.id, scope))
}

import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { isLocalDevelopment } from "@/lib/config"

export async function GET(request: NextRequest) {
  if (!isLocalDevelopment()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const cookieStore = cookies()
  cookieStore.delete("dev-admin")

  return NextResponse.redirect(new URL("/login", request.url))
}

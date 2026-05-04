import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { isLocalDevelopment } from "@/lib/config"

export async function GET(request: NextRequest) {
  if (!isLocalDevelopment()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const cookieStore = cookies()
  cookieStore.set("dev-admin", "true", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 // 1 week
  })

  console.log("[dev-login] Cookie set, redirecting to /")
  return NextResponse.redirect(new URL("/", request.url))
}

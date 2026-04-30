import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { isLocalDevelopment } from "@/lib/config"

export async function POST() {
  if (!isLocalDevelopment()) {
    return NextResponse.json({ error: "Only available in local development" }, { status: 403 })
  }

  const cookieStore = cookies()
  const currentRole = cookieStore.get("dev-role")?.value || "ADMIN"
  const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN"
  
  cookieStore.set("dev-role", nextRole, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return NextResponse.json({ role: nextRole })
}

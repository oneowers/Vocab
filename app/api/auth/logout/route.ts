import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()

  // Clear email-session cookie
  cookieStore.delete("email-session")

  // Sign out from Supabase if configured
  const supabase = createSupabaseServerClient()
  if (supabase) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL("/login", request.url))
}

import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { getOnboardingRouteForUser } from "@/lib/onboarding"
import { getPrisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ message: "Password is required" }, { status: 400 })
    }

    const prisma = getPrisma()
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user) {
      return NextResponse.json({ message: "Wrong email or password" }, { status: 401 })
    }

    if (!user.passwordHash) {
      return NextResponse.json({ message: "This account uses Google login. Please sign in with Google." }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json({ message: "Wrong email or password" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    })

    // Try to create a Supabase session for seamless compatibility
    const supabase = createSupabaseServerClient()
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password })
      if (!error) {
        // Supabase session created — redirect flow will work normally
        const onboardingRoute = getOnboardingRouteForUser(user)
        return NextResponse.json({
          message: "Login successful",
          redirectTo: onboardingRoute ?? "/",
          useSupabase: true
        }, { status: 200 })
      }
    }

    // Fallback: set a session cookie directly (no Supabase available)
    const cookieStore = cookies()
    const sessionPayload = JSON.stringify({ userId: user.id, email: user.email })
    const encoded = Buffer.from(sessionPayload).toString("base64")

    cookieStore.set("email-session", encoded, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    const onboardingRoute = getOnboardingRouteForUser(user)

    return NextResponse.json({
      message: "Login successful",
      redirectTo: onboardingRoute ?? "/"
    }, { status: 200 })

  } catch (error) {
    console.error("[login]", error instanceof Error ? error.message : error)
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 })
  }
}

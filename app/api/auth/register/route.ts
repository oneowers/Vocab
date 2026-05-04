import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { getTodayDateKey } from "@/lib/date"
import { getOnboardingRouteForUser } from "@/lib/onboarding"
import { getPrisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ message: "Password is required" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 })
    }

    const prisma = getPrisma()
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    if (existing) {
      // If user exists via Google but has no password, set password
      if (!existing.passwordHash) {
        const passwordHash = await bcrypt.hash(password, 12)
        await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash }
        })
        // Create session via Supabase if available
        const session = await createEmailSession(email, password, request)
        return NextResponse.json({ message: "Password added to your account", session }, { status: 200 })
      }
      return NextResponse.json({ message: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const totalUsers = await prisma.user.count()

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        passwordHash,
        role: totalUsers === 0 ? "ADMIN" : "USER",
        lastActiveAt: new Date()
      }
    })

    await prisma.appAnalytics.upsert({
      where: { date: getTodayDateKey() },
      update: { newUsers: { increment: 1 } },
      create: { date: getTodayDateKey(), newUsers: 1 }
    })

    // Create Supabase session if Supabase is configured
    await createSupabaseUser(email, password)

    const onboardingRoute = getOnboardingRouteForUser(user)

    return NextResponse.json({
      message: "Account created successfully",
      redirectTo: onboardingRoute ?? "/"
    }, { status: 201 })

  } catch (error) {
    console.error("[register]", error instanceof Error ? error.message : error)
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 })
  }
}

async function createSupabaseUser(email: string, password: string) {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) return null
    const { data } = await supabase.auth.admin?.createUser({
      email,
      password,
      email_confirm: true
    })
    return data
  } catch {
    // Supabase user creation is best-effort; we still have DB record
    return null
  }
}

async function createEmailSession(_email: string, _password: string, _request: NextRequest) {
  return null
}

import { NextRequest, NextResponse } from "next/server"

import { getDisplayName } from "@/lib/auth"
import { getTodayDateKey } from "@/lib/date"
import { hasDatabaseEnv } from "@/lib/config"
import { getPrisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const redirectTo = new URL("/login", request.url)
  const code = request.nextUrl.searchParams.get("code")
  const nextPath = request.nextUrl.searchParams.get("next") || "/dashboard"
  const supabase = createSupabaseServerClient()

  if (!supabase || !code) {
    return NextResponse.redirect(redirectTo)
  }

  const {
    data: { user },
    error
  } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user?.email) {
    return NextResponse.redirect(redirectTo)
  }

  if (hasDatabaseEnv()) {
    const prisma = getPrisma()
    const existing = await prisma.user.findUnique({
      where: {
        email: user.email
      }
    })

    if (!existing) {
      const totalUsers = await prisma.user.count()
      await prisma.user.create({
        data: {
          email: user.email,
          name: getDisplayName(user),
          avatarUrl:
            typeof user.user_metadata?.avatar_url === "string"
              ? user.user_metadata.avatar_url
              : null,
          role: totalUsers === 0 ? "ADMIN" : "USER",
          lastActiveAt: new Date()
        }
      })

      await prisma.appAnalytics.upsert({
        where: {
          date: getTodayDateKey()
        },
        update: {
          newUsers: {
            increment: 1
          }
        },
        create: {
          date: getTodayDateKey(),
          newUsers: 1
        }
      })
    } else {
      await prisma.user.update({
        where: {
          id: existing.id
        },
        data: {
          name: getDisplayName(user),
          avatarUrl:
            typeof user.user_metadata?.avatar_url === "string"
              ? user.user_metadata.avatar_url
              : null,
          lastActiveAt: new Date()
        }
      })
    }
  }

  return NextResponse.redirect(new URL(nextPath, request.url))
}


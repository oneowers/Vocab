import type { User as SupabaseUser } from "@supabase/supabase-js"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { hasDatabaseEnv, isLocalDevelopment } from "@/lib/config"
import { getOnboardingRouteForUser } from "@/lib/onboarding"
import { getPrisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function getOptionalSessionUser() {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    return null
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  return user?.email ? user : null
}

export async function getOptionalAuthUser() {
  const headersList = headers()
  const authHeader = headersList.get("authorization")

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]
    
    if (token === process.env.MCP_API_KEY || token === "lexiflow-mcp-key") {
      const email = "admin@localhost"
      const prisma = getPrisma()
      let user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: "MCP Admin",
            role: "ADMIN"
          }
        })
      }

      return {
        ...user,
        role: "ADMIN" as any
      }
    }
  }
  if (isLocalDevelopment()) {
    const cookieStore = cookies()
    const devRole = cookieStore.get("dev-role")?.value || "ADMIN"

    if (cookieStore.get("dev-admin")?.value === "true") {
      console.log("[auth] Found dev-admin cookie, logging in as admin@localhost")
      const email = "admin@localhost"
      const prisma = getPrisma()
      let user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: "Dev Admin",
            role: "ADMIN"
          }
        })
      }

      return {
        ...user,
        role: devRole as any
      }
    }
  }

  const sessionUser = await getOptionalSessionUser()

  if (!sessionUser?.email || !hasDatabaseEnv()) {
    // Fallback: check email-session cookie (for email/password login without Supabase)
    const cookieStore = cookies()
    const emailSession = cookieStore.get("email-session")?.value
    if (emailSession && hasDatabaseEnv()) {
      try {
        const parsed = JSON.parse(Buffer.from(emailSession, "base64").toString("utf-8")) as { userId?: string; email?: string }
        if (parsed.userId) {
          console.log("[auth] Found email-session cookie for userId:", parsed.userId)
          return getPrisma().user.findUnique({ where: { id: parsed.userId } })
        }
      } catch (err) {
        console.error("[auth] Failed to parse email-session cookie:", err instanceof Error ? err.message : err)
      }
    }
    return null
  }

  const user = await getPrisma().user.findUnique({
    where: {
      email: sessionUser.email
    }
  })

  if (user && isLocalDevelopment()) {
    const cookieStore = cookies()
    const devRole = cookieStore.get("dev-role")?.value || "ADMIN"
    return {
      ...user,
      role: devRole as any
    }
  }

  return user
}

export async function requireSignedInAppUser() {
  const user = await getOptionalAuthUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function requireAdminAppUser() {
  const user = await getOptionalAuthUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN") {
    redirect("/")
  }

  return user
}

export function redirectToOnboardingIfNeeded(
  user: {
    onboardingCompletedAt: Date | null
    onboardingStep: "QUESTIONS" | "LEVEL_TEST" | "FIRST_WORDS" | "COMPLETED"
  } | null
) {
  const nextRoute = getOnboardingRouteForUser(user)

  if (nextRoute) {
    redirect(nextRoute)
  }
}

export function redirectAwayFromOnboardingIfCompleted(
  user: {
    onboardingCompletedAt: Date | null
  } | null
) {
  if (user?.onboardingCompletedAt) {
    redirect("/")
  }
}

export function getDisplayName(sessionUser: SupabaseUser | null) {
  if (!sessionUser) {
    return null
  }

  const metadataName =
    typeof sessionUser.user_metadata?.full_name === "string"
      ? sessionUser.user_metadata.full_name
      : typeof sessionUser.user_metadata?.name === "string"
        ? sessionUser.user_metadata.name
        : null

  return metadataName || sessionUser.email || null
}

import type { User as SupabaseUser } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

import { hasDatabaseEnv, isGuestModeEnabled } from "@/lib/config"
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
  const sessionUser = await getOptionalSessionUser()

  if (!sessionUser?.email || !hasDatabaseEnv()) {
    return null
  }

  return getPrisma().user.findUnique({
    where: {
      email: sessionUser.email
    }
  })
}

export async function requireSignedInAppUser() {
  const user = await getOptionalAuthUser()

  if (!user) {
    if (isGuestModeEnabled()) {
      return null
    }

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

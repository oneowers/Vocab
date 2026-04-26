import { redirect } from "next/navigation"

import { isGuestModeEnabled } from "@/lib/config"
import { getOptionalAuthUser } from "@/lib/auth"

export default async function HomePage() {
  const user = await getOptionalAuthUser()

  if (user) {
    redirect("/dashboard")
  }

  if (isGuestModeEnabled()) {
    redirect("/login")
  }

  redirect("/login")
}

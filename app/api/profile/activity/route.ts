import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { isGuestModeEnabled } from "@/lib/config"
import { buildEmptyProfileActivity } from "@/lib/profile-data"
import { getUserProfileActivityData } from "@/lib/server-data"

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    if (isGuestModeEnabled()) {
      return NextResponse.json(buildEmptyProfileActivity())
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(await getUserProfileActivityData(user.id))
}

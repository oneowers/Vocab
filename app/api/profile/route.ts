import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { serializeUser } from "@/lib/serializers"

export async function PATCH(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    reviewLives?: number
  }

  if (
    typeof body.reviewLives !== "number" ||
    !Number.isInteger(body.reviewLives) ||
    body.reviewLives < 1 ||
    body.reviewLives > 5
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const updatedUser = await getPrisma().user.update({
    where: {
      id: user.id
    },
    data: {
      reviewLives: body.reviewLives
    }
  })

  return NextResponse.json({
    user: serializeUser(updatedUser)
  })
}

import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { isCefrLevel } from "@/lib/catalog"
import { getPrisma } from "@/lib/prisma"
import { userCacheTag } from "@/lib/server-cache"
import { serializeUser } from "@/lib/serializers"

export async function PATCH(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    reviewLives?: number
    cefrLevel?: string
  }

  const nextReviewLives =
    typeof body.reviewLives === "number" ? body.reviewLives : undefined
  const nextCefrLevel =
    typeof body.cefrLevel === "string" ? body.cefrLevel.trim().toUpperCase() : undefined

  if (
    nextReviewLives === undefined &&
    nextCefrLevel === undefined
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (
    nextReviewLives !== undefined &&
    (!Number.isInteger(nextReviewLives) || nextReviewLives < 1 || nextReviewLives > 5)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (nextCefrLevel !== undefined && !isCefrLevel(nextCefrLevel)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (nextCefrLevel !== undefined && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "CEFR level is managed by onboarding and tests." },
      { status: 403 }
    )
  }

  const updatedUser = await getPrisma().user.update({
    where: {
      id: user.id
    },
    data: {
      ...(nextReviewLives !== undefined ? { reviewLives: nextReviewLives } : {}),
      ...(nextCefrLevel !== undefined ? { cefrLevel: nextCefrLevel } : {})
    }
  })

  revalidateTag(userCacheTag.profile(user.id))
  revalidateTag(userCacheTag.cards(user.id))
  revalidateTag(userCacheTag.review(user.id))

  return NextResponse.json({
    user: serializeUser(updatedUser)
  })
}

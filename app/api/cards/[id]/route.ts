import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { serializedCardSelect } from "@/lib/db-selects"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag, userCacheTag } from "@/lib/server-cache"
import { serializeCard } from "@/lib/serializers"

export async function PATCH(
  request: NextRequest,
  context: {
    params: {
      id: string
    }
  }
) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrisma()
  const existing = await prisma.card.findFirst({
    where: {
      id: context.params.id,
      userId: user.id
    },
    select: serializedCardSelect
  })

  if (!existing) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 })
  }

  const body = (await request.json()) as {
    nextReviewDate?: string
    lastReviewResult?: "known" | "unknown"
    reviewCount?: number
    correctCount?: number
    wrongCount?: number
  }

  const card = await prisma.card.update({
    where: {
      id: existing.id
    },
    select: serializedCardSelect,
    data: {
      nextReviewDate: body.nextReviewDate ?? existing.nextReviewDate,
      lastReviewResult: body.lastReviewResult ?? existing.lastReviewResult,
      reviewCount: typeof body.reviewCount === "number" ? body.reviewCount : existing.reviewCount,
      correctCount:
        typeof body.correctCount === "number" ? body.correctCount : existing.correctCount,
      wrongCount: typeof body.wrongCount === "number" ? body.wrongCount : existing.wrongCount
    }
  })

  revalidateTag(userCacheTag.cards(user.id))
  revalidateTag(userCacheTag.review(user.id))
  revalidateTag(userCacheTag.stats(user.id))

  return NextResponse.json({ card: serializeCard(card) })
}

export async function DELETE(
  _request: NextRequest,
  context: {
    params: {
      id: string
    }
  }
) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrisma()
  const existing = await prisma.card.findFirst({
    where: {
      id: context.params.id,
      userId: user.id
    },
    select: serializedCardSelect
  })

  if (!existing) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 })
  }

  await prisma.card.delete({
    where: {
      id: existing.id
    }
  })

  revalidateTag(userCacheTag.cards(user.id))
  revalidateTag(userCacheTag.review(user.id))
  revalidateTag(userCacheTag.stats(user.id))
  revalidateTag(adminCacheTag.analytics)

  return NextResponse.json({ success: true })
}

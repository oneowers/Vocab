import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
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
    }
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
    data: {
      nextReviewDate: body.nextReviewDate ?? existing.nextReviewDate,
      lastReviewResult: body.lastReviewResult ?? existing.lastReviewResult,
      reviewCount: typeof body.reviewCount === "number" ? body.reviewCount : existing.reviewCount,
      correctCount:
        typeof body.correctCount === "number" ? body.correctCount : existing.correctCount,
      wrongCount: typeof body.wrongCount === "number" ? body.wrongCount : existing.wrongCount
    }
  })

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
    }
  })

  if (!existing) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 })
  }

  await prisma.card.delete({
    where: {
      id: existing.id
    }
  })

  return NextResponse.json({ success: true })
}

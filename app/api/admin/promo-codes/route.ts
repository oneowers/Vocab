import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import type { AdminPromoCodesPayload } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const prisma = getPrisma()
    const user = await getOptionalAuthUser()

    if (user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page")) || 1
    const limit = 20
    const skip = (page - 1) * limit

    const [totalItems, promoCodes] = await Promise.all([
      prisma.promoCode.count(),
      prisma.promoCode.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip
      })
    ])

    const payload: AdminPromoCodesPayload = {
      items: promoCodes.map((code) => ({
        id: code.id,
        code: code.code,
        description: code.description,
        maxUses: code.maxUses,
        currentUses: code.currentUses,
        expiresAt: code.expiresAt?.toISOString() ?? null,
        isActive: code.isActive,
        proDurationDays: code.proDurationDays,
        createdAt: code.createdAt.toISOString(),
        updatedAt: code.updatedAt.toISOString()
      })),
      page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Failed to fetch promo codes:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma()
    const user = await getOptionalAuthUser()

    if (user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = (await request.json()) as {
      code: string
      description?: string
      maxUses?: number
      expiresAt?: string
      proDurationDays?: number
    }

    if (!body.code) {
      return new NextResponse("Code is required", { status: 400 })
    }

    const newCode = await prisma.promoCode.create({
      data: {
        code: body.code.toUpperCase(),
        description: body.description || null,
        maxUses: body.maxUses || null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        proDurationDays: body.proDurationDays ?? 30
      }
    })

    return NextResponse.json(newCode)
  } catch (error) {
    console.error("Failed to create promo code:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

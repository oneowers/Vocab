import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const prisma = getPrisma()
    const user = await getOptionalAuthUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { code } = (await request.json()) as { code: string }

    if (!code || typeof code !== "string") {
      return new NextResponse("Promo code is required", { status: 400 })
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!promoCode) {
      return new NextResponse("Invalid promo code", { status: 400 })
    }

    if (!promoCode.isActive) {
      return new NextResponse("This promo code is no longer active", { status: 400 })
    }

    if (promoCode.maxUses !== null && promoCode.currentUses >= promoCode.maxUses) {
      return new NextResponse("This promo code has reached its usage limit", { status: 400 })
    }

    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return new NextResponse("This promo code has expired", { status: 400 })
    }

    // Check if user already used this promo code
    const existingUsage = await prisma.promoCodeUsage.findUnique({
      where: {
        userId_promoCodeId: {
          userId: user.id,
          promoCodeId: promoCode.id
        }
      }
    })

    if (existingUsage) {
      return new NextResponse("You have already used this promo code", { status: 400 })
    }

    // Calculate new PRO until date
    const now = new Date()
    const currentProUntil = user.proUntil && user.proUntil > now ? user.proUntil : now
    const newProUntil = new Date(currentProUntil.getTime() + promoCode.proDurationDays * 24 * 60 * 60 * 1000)

    // Run in transaction to ensure atomicity
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          role: user.role === "ADMIN" ? "ADMIN" : "PRO",
          proUntil: newProUntil
        }
      }),
      prisma.promoCode.update({
        where: { id: promoCode.id },
        data: { currentUses: { increment: 1 } }
      }),
      prisma.promoCodeUsage.create({
        data: {
          userId: user.id,
          promoCodeId: promoCode.id
        }
      })
    ])

    return NextResponse.json({ success: true, proUntil: newProUntil })
  } catch (error) {
    console.error("Failed to redeem promo code:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

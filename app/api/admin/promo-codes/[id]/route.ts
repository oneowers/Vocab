import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const prisma = getPrisma()
    const user = await getOptionalAuthUser()

    if (user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = (await request.json()) as {
      code?: string
      description?: string | null
      maxUses?: number | null
      expiresAt?: string | null
      isActive?: boolean
      proDurationDays?: number
    }

    const updatedCode = await prisma.promoCode.update({
      where: { id: params.id },
      data: {
        code: body.code?.toUpperCase(),
        description: body.description,
        maxUses: body.maxUses,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
        isActive: body.isActive,
        proDurationDays: body.proDurationDays
      }
    })

    return NextResponse.json(updatedCode)
  } catch (error) {
    console.error("Failed to update promo code:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const prisma = getPrisma()
    const user = await getOptionalAuthUser()

    if (user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.promoCode.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete promo code:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

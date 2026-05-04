import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getOptionalAuthUser()

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { password, currentPassword } = body

    if (!password || typeof password !== "string") {
      return NextResponse.json({ message: "Password is required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 })
    }

    const prisma = getPrisma()
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true }
    })

    // If user already has a password, require current password for change
    if (dbUser?.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Current password is required to change it" }, { status: 400 })
      }
      const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
      if (!isValid) {
        return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })

    return NextResponse.json({
      message: dbUser?.passwordHash ? "Password changed successfully" : "Password set successfully"
    }, { status: 200 })

  } catch (error) {
    console.error("[password]", error instanceof Error ? error.message : error)
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 })
  }
}

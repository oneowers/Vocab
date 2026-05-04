import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { serializeUser } from "@/lib/serializers"

export async function GET(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const page = Math.max(Number(request.nextUrl.searchParams.get("page") || "1"), 1)
  const search = request.nextUrl.searchParams.get("search")?.trim()
  const pageSize = 20
  const exportAll = request.nextUrl.searchParams.get("all") === "true"
  const prisma = getPrisma()
  const where = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const
            }
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const
            }
          }
        ]
      }
    : {}

  const [totalItems, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      ...(exportAll
        ? {}
        : {
            skip: (page - 1) * pageSize,
            take: pageSize
          }),
      include: {
        _count: {
          select: {
            cards: true,
            reviewLogs: true
          }
        }
      }
    })
  ])

  return NextResponse.json({
    items: users.map((item) => ({
      ...serializeUser(item),
      cardCount: item._count.cards,
      reviewCount: item._count.reviewLogs
    })),
    page,
    totalPages: exportAll ? 1 : Math.max(Math.ceil(totalItems / pageSize), 1),
    totalItems
  })
}

export async function POST(request: NextRequest) {
  const admin = await getOptionalAuthUser()

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { email, name, password, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const prisma = getPrisma()
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        role: role || "USER",
        onboardingStep: "COMPLETED", // Skip onboarding for admin-created users
        streak: 0
      }
    })

    return NextResponse.json({ user: serializeUser(user) })
  } catch (error) {
    console.error("[admin-create-user] error:", error)
    return NextResponse.json({ error: "Could not create user" }, { status: 500 })
  }
}

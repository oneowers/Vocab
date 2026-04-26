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

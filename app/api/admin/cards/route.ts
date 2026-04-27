import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { serializeCard } from "@/lib/serializers"

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
  const pageSize = 50
  const prisma = getPrisma()
  const where = search
    ? {
        OR: [
          {
            original: {
              contains: search,
              mode: "insensitive" as const
            }
          },
          {
            translation: {
              contains: search,
              mode: "insensitive" as const
            }
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive" as const
              }
            }
          }
        ]
      }
    : {}

  const [totalItems, cards] = await Promise.all([
    prisma.card.count({ where }),
    prisma.card.findMany({
      where,
      orderBy: {
        dateAdded: "desc"
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        catalogWord: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })
  ])

  return NextResponse.json({
    items: cards.map((card) => serializeCard(card)),
    page,
    totalPages: Math.max(Math.ceil(totalItems / pageSize), 1),
    totalItems
  })
}

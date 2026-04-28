import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { adminCacheTag } from "@/lib/server-cache"

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

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as {
    role?: "USER" | "PRO" | "ADMIN"
  }

  if (body.role !== "USER" && body.role !== "PRO" && body.role !== "ADMIN") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const prisma = getPrisma()
  const updated = await prisma.user.update({
    where: {
      id: context.params.id
    },
    data: {
      role: body.role
    }
  })

  revalidateTag(adminCacheTag.analytics)

  return NextResponse.json({ role: updated.role })
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

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await getPrisma().user.delete({
    where: {
      id: context.params.id
    }
  })

  revalidateTag(adminCacheTag.analytics)

  return NextResponse.json({ success: true })
}

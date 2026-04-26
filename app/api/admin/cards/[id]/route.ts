import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"

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

  await getPrisma().card.delete({
    where: {
      id: context.params.id
    }
  })

  return NextResponse.json({ success: true })
}


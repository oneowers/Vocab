import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getOrCreateAppSettings } from "@/lib/catalog"
import { getPrisma } from "@/lib/prisma"
import { serializeAppSettings } from "@/lib/serializers"

async function requireAdminUser() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  if (user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return {
    user
  }
}

export async function GET() {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  const settings = await getOrCreateAppSettings(getPrisma())

  return NextResponse.json({
    settings: serializeAppSettings(settings)
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser()

  if ("error" in auth) {
    return auth.error
  }

  const body = (await request.json()) as {
    dailyNewCardsLimit?: number
  }

  if (
    typeof body.dailyNewCardsLimit !== "number" ||
    !Number.isInteger(body.dailyNewCardsLimit) ||
    body.dailyNewCardsLimit < 1 ||
    body.dailyNewCardsLimit > 100
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const settings = await getPrisma().appSettings.upsert({
    where: {
      id: "app"
    },
    update: {
      dailyNewCardsLimit: body.dailyNewCardsLimit
    },
    create: {
      id: "app",
      dailyNewCardsLimit: body.dailyNewCardsLimit
    }
  })

  return NextResponse.json({
    settings: serializeAppSettings(settings)
  })
}

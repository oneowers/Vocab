import { NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"

const REVIEW_STAGES = new Set(["flip", "quiz", "write", "challenge"])
const REVIEW_FLOWS = new Set(["linked", "single"])
const STATUS_FILTERS = new Set(["All", "known", "unknown"])

function serializePracticeSession(session: {
  id: string
  cardIds: string[]
  completedStages: string[]
  activeStage: string
  selectedStatus: string
  flow: string
  state: unknown
  updatedAt: Date
}) {
  return {
    id: session.id,
    cardIds: session.cardIds,
    completedStages: session.completedStages,
    activeStage: session.activeStage,
    selectedStatus: session.selectedStatus,
    flow: session.flow,
    state: session.state,
    updatedAt: session.updatedAt.toISOString()
  }
}

export async function GET() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const session = await getPrisma().practiceSessionProgress.findUnique({
    where: {
      userId: user.id
    }
  })

  return NextResponse.json({
    session: session ? serializePracticeSession(session) : null
  })
}

export async function PATCH(request: Request) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    cardIds?: unknown
    completedStages?: unknown
    activeStage?: unknown
    selectedStatus?: unknown
    flow?: unknown
    state?: unknown
  }

  const cardIds = Array.isArray(body.cardIds)
    ? body.cardIds.filter((item): item is string => typeof item === "string" && Boolean(item))
    : []
  const completedStages = Array.isArray(body.completedStages)
    ? body.completedStages.filter((item): item is string => typeof item === "string" && REVIEW_STAGES.has(item))
    : []
  const activeStage = typeof body.activeStage === "string" && REVIEW_STAGES.has(body.activeStage)
    ? body.activeStage
    : null
  const selectedStatus =
    typeof body.selectedStatus === "string" && STATUS_FILTERS.has(body.selectedStatus)
      ? body.selectedStatus
      : "All"
  const flow = typeof body.flow === "string" && REVIEW_FLOWS.has(body.flow)
    ? body.flow
    : "linked"

  if (!cardIds.length || !activeStage) {
    return NextResponse.json({ error: "Missing practice session fields." }, { status: 400 })
  }

  const session = await getPrisma().practiceSessionProgress.upsert({
    where: {
      userId: user.id
    },
    update: {
      cardIds,
      completedStages,
      activeStage,
      selectedStatus,
      flow,
      state: body.state ?? {}
    },
    create: {
      userId: user.id,
      cardIds,
      completedStages,
      activeStage,
      selectedStatus,
      flow,
      state: body.state ?? {}
    }
  })

  return NextResponse.json({
    session: serializePracticeSession(session)
  })
}

export async function DELETE() {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await getPrisma().practiceSessionProgress.deleteMany({
    where: {
      userId: user.id
    }
  })

  return NextResponse.json({ ok: true })
}

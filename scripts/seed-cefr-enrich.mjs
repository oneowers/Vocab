import { PrismaClient } from "@prisma/client"
import { enrichSeedWords } from "../lib/cefr-seed.ts"

function getArg(flag) {
  const index = process.argv.indexOf(flag)

  if (index === -1) {
    return null
  }

  return process.argv[index + 1] ?? null
}

const limitArg = getArg("--limit")
const limit = Math.max(Number(limitArg || "100"), 1)

const prisma = new PrismaClient()

try {
  const result = await enrichSeedWords({
    prisma,
    limit
  })

  console.log(JSON.stringify(result, null, 2))
} finally {
  await prisma.$disconnect()
}

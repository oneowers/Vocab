import { PrismaClient } from "@prisma/client"
import { buildSeedReport } from "../lib/cefr-seed.ts"

const prisma = new PrismaClient()

try {
  const result = await buildSeedReport(prisma)
  console.log(JSON.stringify(result, null, 2))
} finally {
  await prisma.$disconnect()
}

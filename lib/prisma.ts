import { PrismaClient } from "@prisma/client"

declare global {
  var __wordflowPrisma: PrismaClient | undefined
}

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.")
  }

  if (!global.__wordflowPrisma) {
    global.__wordflowPrisma = new PrismaClient()
  }

  return global.__wordflowPrisma
}


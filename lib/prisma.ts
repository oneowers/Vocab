import { PrismaClient } from "@prisma/client"

declare global {
  var __lexiflowPrisma: PrismaClient | undefined
}

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.")
  }

  if (!global.__lexiflowPrisma) {
    global.__lexiflowPrisma = new PrismaClient()
  }

  return global.__lexiflowPrisma
}

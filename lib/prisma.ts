import { PrismaClient } from "@prisma/client"

declare global {
  var __lexiflowPrismaV2: PrismaClient | undefined
}

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.")
  }

  if (!global.__lexiflowPrismaV2) {
    global.__lexiflowPrismaV2 = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === "development" ? ["error"] : []
    })
  }

  return global.__lexiflowPrismaV2
}

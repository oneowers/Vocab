import { PrismaClient } from "@prisma/client"

declare global {
  var __lexiflowPrismaV2: PrismaClient | undefined
}

export function getPrisma() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not configured.")
  }

  if (!global.__lexiflowPrismaV2) {
    // Append connection pool parameters if not present
    let urlWithParams = dbUrl
    if (!dbUrl.includes("connection_limit=")) {
      const separator = dbUrl.includes("?") ? "&" : "?"
      urlWithParams = `${dbUrl}${separator}connection_limit=5&pool_timeout=30`
    }

    global.__lexiflowPrismaV2 = new PrismaClient({
      datasources: {
        db: {
          url: urlWithParams
        }
      },
      log: process.env.NODE_ENV === "development" ? ["error"] : []
    })
  }

  return global.__lexiflowPrismaV2
}

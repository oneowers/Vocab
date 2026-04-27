import { PrismaClient } from "@prisma/client"
import { importSeedWords } from "../lib/cefr-seed.ts"
import { CEFR_LEVELS } from "../lib/catalog.ts"

function getArg(flag) {
  const index = process.argv.indexOf(flag)

  if (index === -1) {
    return null
  }

  return process.argv[index + 1] ?? null
}

const sqlitePath = getArg("--db")
const levelsArg = getArg("--levels")

if (!sqlitePath) {
  console.error("Usage: npm run seed:cefr:import -- --db /path/to/word_cefr_minified.db --levels A1,A2")
  process.exit(1)
}

const levels = (levelsArg ? levelsArg.split(",") : CEFR_LEVELS)
  .map((item) => item.trim().toUpperCase())
  .filter((item) => CEFR_LEVELS.includes(item))

if (!levels.length) {
  console.error("No valid CEFR levels provided.")
  process.exit(1)
}

const prisma = new PrismaClient()

try {
  const result = await importSeedWords({
    prisma,
    sqlitePath,
    levels
  })

  console.log(JSON.stringify(result, null, 2))
} finally {
  await prisma.$disconnect()
}

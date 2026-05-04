
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPerformance() {
  console.log("--- Backend Performance Audit ---\n");

  // Test 1: Simple DB Query (Warmup)
  const start1 = Date.now();
  await prisma.user.findFirst();
  console.log(`1. Database connection warmup: ${Date.now() - start1}ms`);

  // Test 2: Heavy Dictionary Query
  const start2 = Date.now();
  const words = await prisma.grammarTopic.findMany({
    take: 10,
    include: { findings: true }
  });
  console.log(`2. Complex query (Grammar + Findings): ${Date.now() - start2}ms`);

  // Test 3: Multiple Parallel Queries (Concurrency check)
  const start3 = Date.now();
  await Promise.all([
    prisma.user.count(),
    prisma.appSettings.findFirst(),
    prisma.grammarTopic.count()
  ]);
  console.log(`3. Parallel execution (3 queries): ${Date.now() - start3}ms`);

  console.log("\n--- Audit Complete ---");
  process.exit(0);
}

testPerformance().catch(err => {
  console.error(err);
  process.exit(1);
});

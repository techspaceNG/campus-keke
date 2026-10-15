import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
  console.log('JOURNAL_MODE:', result);
  const timeout = await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 10000;');
  console.log('BUSY_TIMEOUT:', timeout);
  await prisma.$disconnect();
}

main().catch(console.error);

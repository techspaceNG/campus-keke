import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Initializing Campus Keke Database (Production Clean) ---');

  // 1. Clean existing records (in order of relations)
  await prisma.failedScanLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.rideTransaction.deleteMany();
  await prisma.ticketRefill.deleteMany();
  await prisma.ticketSale.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.student.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  // 2. System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'FARE_PER_RIDE', value: '150', description: 'Standard ride fare in Naira' },
      { key: 'CAMPUS_NAME', value: 'Federal College of Education (Technical) Bichi', description: 'Campus transportation zone' },
      { key: 'CURRENCY_SYMBOL', value: '₦', description: 'Nigerian Naira' },
    ],
  });

  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 3. Create System Administrator
  const adminUser = await prisma.user.create({
    data: {
      username: 'ADMIN',
      email: 'admin@campuskeke.edu',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('========================================================');
  console.log('  Clean database initialized successfully!');
  console.log(`  Admin User     : ${adminUser.username}`);
  console.log('  Default Password: admin123');
  console.log('  Role           : System Administrator');
  console.log('========================================================');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

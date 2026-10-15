import { PrismaClient } from '@prisma/client';
import { CONFIG } from '../config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: CONFIG.DATABASE_URL,
    },
  },
});

async function main() {
  const count = await prisma.vehicle.count();
  console.log('Current vehicle count:', count);
  if (count === 0) {
    const defaultVehicles = [
      { kekeNumber: 'KEKE-01', plateNumber: 'BC-01-FCE', model: 'Bajaj RE 4S', capacity: 4 },
      { kekeNumber: 'KEKE-02', plateNumber: 'BC-02-FCE', model: 'Bajaj RE 4S', capacity: 4 },
      { kekeNumber: 'KEKE-03', plateNumber: 'BC-03-FCE', model: 'Bajaj RE 4S', capacity: 4 },
      { kekeNumber: 'KEKE-04', plateNumber: 'BC-04-FCE', model: 'TVS King Deluxe', capacity: 4 },
      { kekeNumber: 'KEKE-05', plateNumber: 'BC-05-FCE', model: 'Piaggio Ape City', capacity: 4 },
    ];
    for (const v of defaultVehicles) {
      await prisma.vehicle.create({ data: v });
      console.log('Created vehicle:', v.kekeNumber, v.plateNumber);
    }
  }
  const vehicles = await prisma.vehicle.findMany();
  console.log(`Total vehicles in database: ${vehicles.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

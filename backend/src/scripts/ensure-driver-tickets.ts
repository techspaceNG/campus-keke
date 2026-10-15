import { prisma } from '../utils/prisma';
import { AdminService } from '../services/admin.service';

async function main() {
  console.log('Ensuring all drivers have emergency tickets...');
  const drivers = await prisma.driver.findMany({
    include: { emergencyTickets: true }
  });
  console.log(`Found ${drivers.length} drivers.`);

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('No admin found!');
    return;
  }

  for (const driver of drivers) {
    if (!driver.emergencyTickets || driver.emergencyTickets.length === 0) {
      console.log(`Driver ${driver.driverCode} (${driver.fullName}) has no emergency ticket. Provisioning...`);
      try {
        const ticket = await AdminService.provisionEmergencyTicketForDriver(
          driver.id,
          driver.driverCode,
          admin.id,
          20
        );
        console.log(`Successfully created ticket ${ticket.ticketNumber} for driver ${driver.driverCode}!`);
      } catch (err: any) {
        console.error(`Failed to provision for ${driver.driverCode}:`, err);
      }
    } else {
      console.log(`Driver ${driver.driverCode} already has emergency ticket: ${driver.emergencyTickets[0].ticketNumber}`);
    }
  }

  const finalCheck = await prisma.driver.findMany({
    select: {
      driverCode: true,
      fullName: true,
      emergencyTickets: {
        select: {
          ticketNumber: true,
          remainingRides: true,
          status: true,
        }
      }
    }
  });
  console.log('Final drivers check:', JSON.stringify(finalCheck, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

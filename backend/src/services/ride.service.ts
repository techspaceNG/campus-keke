import { prisma } from '../utils/prisma';
import {
  generateTransactionNumber,
  verifyTicketPayloadSignature,
} from '../utils/crypto';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors';
import {
  TICKET_STATUS,
  DRIVER_STATUS,
  VALIDATION_METHODS,
  RIDE_SOURCES,
} from '../config';
import { createAuditLog } from '../utils/audit';

export interface ValidateRideInput {
  driverUserId: string; // The authenticated driver's User ID
  ticketInput: string; // QR code payload string OR manual ticketNumber string
  validationMethod: keyof typeof VALIDATION_METHODS; // QR_SCAN or MANUAL_ENTRY
  idempotencyKey: string; // Unique client request key (UUID)
  useDriverEmergencyCredit?: boolean; // When student has no rides and driver ticket is authorized
  ipAddress?: string;
  userAgent?: string;
}

export class RideService {
  /**
   * Universal, concurrency-safe ride validation and atomic deduction service.
   * Both QR Scan and Manual Ticket ID entry use this exact method.
   */
  static async validateAndActivateRide(input: ValidateRideInput) {
    const {
      driverUserId,
      ticketInput,
      validationMethod,
      idempotencyKey,
      useDriverEmergencyCredit,
      ipAddress,
      userAgent,
    } = input;

    // 1. Idempotency Check:
    // If a transaction with this idempotencyKey has already been processed,
    // return that existing transaction to prevent double deduction.
    const existingTransaction = await prisma.rideTransaction.findUnique({
      where: { idempotencyKey },
      include: {
        ticket: true,
        student: true,
        driver: { include: { assignedVehicle: true } },
        vehicle: true,
      },
    });

    if (existingTransaction) {
      return {
        isIdempotentReplay: true,
        transaction: existingTransaction,
        message: 'Ride transaction was already confirmed (idempotent replay).',
      };
    }

    // 2. Validate Driver Authorization
    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId },
      include: {
        assignedVehicle: true,
        emergencyTickets: {
          where: {
            status: TICKET_STATUS.ACTIVE,
            remainingRides: { gt: 0 },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!driver) {
      throw new ForbiddenError('Driver profile not found.');
    }

    if (driver.status !== DRIVER_STATUS.ACTIVE) {
      throw new ForbiddenError(`Driver account is currently ${driver.status}. Cannot validate rides.`);
    }

    // 3. Resolve Ticket Number & Verify QR Integrity if QR scanned
    let resolvedTicketNumber = ticketInput.trim().toUpperCase();

    // Check if input is a JSON QR payload
    if (ticketInput.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(ticketInput);
        if (parsed.t) {
          resolvedTicketNumber = parsed.t.toUpperCase();
          if (parsed.k && parsed.s) {
            const isSignatureValid = verifyTicketPayloadSignature(parsed.t, parsed.k, parsed.s);
            if (!isSignatureValid) {
              await this.logFailedScan(driver.id, ticketInput, 'INVALID_QR_SIGNATURE', ipAddress);
              throw new BadRequestError('Invalid or counterfeit QR code signature.');
            }
          }
        }
      } catch (err: any) {
        if (err instanceof BadRequestError) throw err;
        // If JSON parse failed, proceed with raw string
      }
    }

    // 4. Determine Funding Ticket
    let targetTicket;
    let rideSource: string = RIDE_SOURCES.STUDENT_TICKET;

    if (useDriverEmergencyCredit) {
      // Emergency driver ticket requested
      const emergencyTicket = driver.emergencyTickets[0];
      if (!emergencyTicket) {
        await this.logFailedScan(driver.id, 'DRIVER_EMERGENCY', 'NO_ACTIVE_DRIVER_TICKET', ipAddress);
        throw new BadRequestError('Driver has no active emergency ride credit available.');
      }
      targetTicket = emergencyTicket;
      rideSource = RIDE_SOURCES.DRIVER_EMERGENCY_TICKET;
    } else {
      // Find Student Ticket
      targetTicket = await prisma.ticket.findFirst({
        where: {
          ticketNumber: resolvedTicketNumber,
        },
        include: {
          student: true,
        },
      });

      if (!targetTicket) {
        await this.logFailedScan(driver.id, resolvedTicketNumber, 'TICKET_NOT_FOUND', ipAddress);
        throw new NotFoundError(`Ticket '${resolvedTicketNumber}' was not found.`);
      }

      if (targetTicket.status === TICKET_STATUS.EXHAUSTED || targetTicket.remainingRides <= 0) {
        await this.logFailedScan(driver.id, resolvedTicketNumber, 'TICKET_EXHAUSTED', ipAddress);
        throw new BadRequestError('Ticket has 0 remaining rides (EXHAUSTED). Please refill before boarding.');
      }

      if (targetTicket.status !== TICKET_STATUS.ACTIVE) {
        await this.logFailedScan(driver.id, resolvedTicketNumber, `INVALID_STATUS_${targetTicket.status}`, ipAddress);
        throw new BadRequestError(`Ticket cannot be used. Status: ${targetTicket.status}`);
      }
    }

    // 5. Concurrency-Safe Atomic Deduction & Transaction Creation
    const transactionNumber = generateTransactionNumber();

    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch ticket inside transaction with strict check
      const currentTicket = await tx.ticket.findUnique({
        where: { id: targetTicket.id },
      });

      if (!currentTicket || currentTicket.remainingRides <= 0) {
        throw new ConflictError('Concurrent deduction detected: Ticket has no remaining rides.');
      }

      const newRemainingRides = currentTicket.remainingRides - 1;
      const newUsedRides = currentTicket.usedRides + 1;
      const newStatus = newRemainingRides === 0 ? TICKET_STATUS.EXHAUSTED : currentTicket.status;

      // Atomic update
      const updatedTicket = await tx.ticket.update({
        where: { id: currentTicket.id },
        data: {
          remainingRides: newRemainingRides,
          usedRides: newUsedRides,
          status: newStatus,
        },
        include: {
          student: true,
        },
      });

      // Record immutable ride transaction
      const rideTransaction = await tx.rideTransaction.create({
        data: {
          transactionNumber,
          ticketId: updatedTicket.id,
          studentId: updatedTicket.studentId,
          driverId: driver.id,
          vehicleId: driver.assignedVehicleId,
          rideSource,
          deductedRides: 1,
          remainingRidesAfter: newRemainingRides,
          validationMethod,
          idempotencyKey,
          status: 'CONFIRMED',
          ipAddress,
          userAgent,
        },
        include: {
          student: true,
          ticket: true,
          driver: true,
          vehicle: true,
        },
      });

      return { updatedTicket, rideTransaction };
    });

    // 6. Audit Log
    await createAuditLog({
      userId: driverUserId,
      action: 'RIDE_VALIDATED',
      entityType: 'RIDE',
      entityId: result.rideTransaction.id,
      details: {
        transactionNumber,
        ticketNumber: result.updatedTicket.ticketNumber,
        remainingRidesAfter: result.updatedTicket.remainingRides,
        validationMethod,
        driverCode: driver.driverCode,
        rideSource,
      },
      ipAddress,
    });

    return {
      isIdempotentReplay: false,
      transaction: result.rideTransaction,
      ticket: {
        ticketNumber: result.updatedTicket.ticketNumber,
        remainingRides: result.updatedTicket.remainingRides,
        totalRides: result.updatedTicket.totalRides,
        status: result.updatedTicket.status,
      },
      student: result.updatedTicket.student ? {
        fullName: result.updatedTicket.student.fullName,
        regNumber: result.updatedTicket.student.regNumber,
      } : null,
      driver: {
        fullName: driver.fullName,
        driverCode: driver.driverCode,
        vehicle: driver.assignedVehicle ? {
          plateNumber: driver.assignedVehicle.plateNumber,
          kekeNumber: driver.assignedVehicle.kekeNumber,
        } : null,
      },
      message: 'Ride successfully activated and 1 ride deducted.',
    };
  }

  /**
   * Helper to log failed scans for monitoring and anti-abuse detection
   */
  private static async logFailedScan(
    driverId: string | null,
    attemptedTicket: string,
    reason: string,
    ipAddress?: string
  ) {
    try {
      await prisma.failedScanLog.create({
        data: {
          driverId,
          attemptedTicket: attemptedTicket.slice(0, 100),
          reason,
          ipAddress,
        },
      });
    } catch (e) {
      console.error('Failed to log scan failure:', e);
    }
  }

  /**
   * Fetch today's rides for driver dashboard
   */
  static async getDriverDailyRides(driverId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rides = await prisma.rideTransaction.findMany({
      where: {
        driverId,
        timestamp: { gte: startOfDay },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        student: true,
        ticket: true,
      },
    });

    return rides;
  }
}

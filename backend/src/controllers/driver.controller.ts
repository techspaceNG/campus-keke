import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { RideService } from '../services/ride.service';
import { AdminService } from '../services/admin.service';

export const validateRideSchema = {
  body: z.object({
    ticketInput: z.string().min(1, 'Ticket ID or QR code is required'),
    validationMethod: z.enum(['QR_SCAN', 'MANUAL_ENTRY']).default('QR_SCAN'),
    idempotencyKey: z.string().min(1, 'Idempotency key is required'),
    useDriverEmergencyCredit: z.boolean().optional().default(false),
  }),
};

export class DriverController {
  /**
   * Driver Dashboard details (Driver info, Vehicle info, Today's rides, Emergency ticket)
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driverId = req.user?.driverId;
      if (!driverId) {
        throw new NotFoundError('Driver profile not found.');
      }

      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          assignedVehicle: true,
          emergencyTickets: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!driver) {
        throw new NotFoundError('Driver not found.');
      }

      if (!driver.emergencyTickets || driver.emergencyTickets.length === 0) {
        const newTicket = await AdminService.provisionEmergencyTicketForDriver(driver.id, driver.driverCode);
        driver.emergencyTickets = [newTicket];
      }

      const todayRides = await RideService.getDriverDailyRides(driver.id);

      res.status(200).json({
        success: true,
        data: {
          driver: {
            id: driver.id,
            driverCode: driver.driverCode,
            fullName: driver.fullName,
            phone: driver.phone,
            licenseNumber: driver.licenseNumber,
            status: driver.status,
          },
          vehicle: driver.assignedVehicle ? {
            id: driver.assignedVehicle.id,
            plateNumber: driver.assignedVehicle.plateNumber,
            kekeNumber: driver.assignedVehicle.kekeNumber,
            model: driver.assignedVehicle.model,
            capacity: driver.assignedVehicle.capacity,
          } : null,
          emergencyTicket: driver.emergencyTickets[0] ? {
            id: driver.emergencyTickets[0].id,
            ticketNumber: driver.emergencyTickets[0].ticketNumber,
            remainingRides: driver.emergencyTickets[0].remainingRides,
            status: driver.emergencyTickets[0].status,
          } : null,
          stats: {
            todayRidesCount: todayRides.length,
          },
          recentTransactions: todayRides.slice(0, 15),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate student ticket or manual Ticket ID and activate ride
   */
  static async validateRide(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await RideService.validateAndActivateRide({
        driverUserId: req.user!.userId,
        ticketInput: req.body.ticketInput,
        validationMethod: req.body.validationMethod,
        idempotencyKey: req.body.idempotencyKey,
        useDriverEmergencyCredit: req.body.useDriverEmergencyCredit,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(result.isIdempotentReplay ? 200 : 201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

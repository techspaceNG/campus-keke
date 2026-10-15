import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AdminService } from '../services/admin.service';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export const createDriverSchema = {
  body: z.object({
    driverCode: z.string().min(2).max(20),
    fullName: z.string().min(2).max(100),
    phone: z.string().min(7).max(20),
    licenseNumber: z.string().min(4).max(50),
    password: z.string().min(6).max(100),
    assignedVehicleId: z.string().optional(),
  }),
};

export const updateDriverStatusSchema = {
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']),
  }),
};

export const assignVehicleSchema = {
  body: z.object({
    vehicleId: z.string().nullable(),
  }),
};

export const createVehicleSchema = {
  body: z.object({
    plateNumber: z.string().min(3).max(20),
    kekeNumber: z.string().min(2).max(20),
    model: z.string().optional(),
    capacity: z.number().int().min(1).max(10).default(4),
  }),
};

export const updateDriverSchema = {
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    phone: z.string().min(7).max(20).optional(),
    driverCode: z.string().min(2).max(20).optional(),
    licenseNumber: z.string().min(4).max(50).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
    assignedVehicleId: z.string().nullable().optional(),
    password: z.string().min(6).max(100).optional(),
  }),
};

export const updateStudentSchema = {
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    phone: z.string().min(7).max(20).optional(),
    regNumber: z.string().min(3).max(30).optional(),
    password: z.string().min(6).max(100).optional(),
  }),
};

export class AdminController {
  static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createDriver(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driver = await AdminService.createDriver(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        data: driver,
        message: 'Driver account successfully created.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateDriverStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driver = await AdminService.updateDriverStatus(
        req.user!.userId,
        String(req.params.id),
        req.body.status
      );
      res.status(200).json({
        success: true,
        data: driver,
        message: `Driver status updated to ${req.body.status}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignVehicle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driver = await AdminService.assignVehicleToDriver(
        req.user!.userId,
        String(req.params.id),
        req.body.vehicleId
      );
      res.status(200).json({
        success: true,
        data: driver,
        message: 'Vehicle assignment updated.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async issueDriverEmergencyTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driverId = String(req.params.id);
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (!driver) {
        throw new NotFoundError('Driver not found');
      }

      const initialRides = req.body?.initialRides ? Number(req.body.initialRides) : 20;
      const ticket = await AdminService.provisionEmergencyTicketForDriver(
        driver.id,
        driver.driverCode,
        req.user!.userId,
        initialRides
      );

      res.status(201).json({
        success: true,
        data: ticket,
        message: `Emergency float ticket provisioned for driver ${driver.driverCode}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createVehicle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await AdminService.createVehicle(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        data: vehicle,
        message: 'Vehicle registered successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async listStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listStudents({
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listDrivers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listDrivers({
        search: req.query.search as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listTickets({
        status: req.query.status as string,
        ticketType: req.query.ticketType as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listTransactions({
        driverId: req.query.driverId as string,
        studentId: req.query.studentId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        validationMethod: req.query.validationMethod as string,
        rideSource: req.query.rideSource as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listAuditLogs({
        search: req.query.search as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listFailedScans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listFailedScans({
        search: req.query.search as string,
        reason: req.query.reason as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateDriver(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driver = await AdminService.updateDriver(req.user!.userId, String(req.params.id), req.body);
      res.status(200).json({
        success: true,
        data: driver,
        message: 'Driver details updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDriver(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.deleteDriver(req.user!.userId, String(req.params.id));
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const student = await AdminService.updateStudent(req.user!.userId, String(req.params.id), req.body);
      res.status(200).json({
        success: true,
        data: student,
        message: 'Student details updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.deleteStudent(req.user!.userId, String(req.params.id));
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listVehicles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vehicles = await AdminService.listVehicles();
      res.status(200).json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteVehicle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.deleteVehicle(req.user!.userId, String(req.params.id));
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

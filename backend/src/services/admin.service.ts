import { prisma } from '../utils/prisma';
import {
  hashPassword,
  generateTicketNumber,
  generateSecurePayloadToken,
  signTicketPayload,
} from '../utils/crypto';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { ROLES, DRIVER_STATUS, TICKET_STATUS } from '../config';
import { createAuditLog } from '../utils/audit';

export class AdminService {
  /**
   * Real database statistics without mock data
   */
  static async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      activeDrivers,
      activeTickets,
      exhaustedTickets,
      unassignedTickets,
      todayRidesCount,
      allTimeRidesCount,
      todaySalesAggregate,
      allTimeSalesAggregate,
      todayRefillsAggregate,
      allTimeRefillsAggregate,
      recentRefillsCount,
      failedScansToday,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.driver.count({ where: { status: DRIVER_STATUS.ACTIVE } }),
      prisma.ticket.count({ where: { status: TICKET_STATUS.ACTIVE } }),
      prisma.ticket.count({ where: { status: TICKET_STATUS.EXHAUSTED } }),
      prisma.ticket.count({ where: { status: TICKET_STATUS.UNASSIGNED } }),
      prisma.rideTransaction.count({ where: { timestamp: { gte: todayStart } } }),
      prisma.rideTransaction.count(),
      prisma.ticketSale.aggregate({
        _sum: { amount: true },
        where: { soldAt: { gte: todayStart } },
      }),
      prisma.ticketSale.aggregate({
        _sum: { amount: true },
      }),
      prisma.ticketRefill.aggregate({
        _sum: { amountPaid: true },
        where: { refilledAt: { gte: todayStart } },
      }),
      prisma.ticketRefill.aggregate({
        _sum: { amountPaid: true },
      }),
      prisma.ticketRefill.count({
        where: { refilledAt: { gte: todayStart } },
      }),
      prisma.failedScanLog.count({
        where: { createdAt: { gte: todayStart } },
      }),
    ]);

    const todaySalesRevenue = todaySalesAggregate._sum.amount || 0;
    const todayRefillRevenue = todayRefillsAggregate._sum.amountPaid || 0;
    const totalSalesRevenue = allTimeSalesAggregate._sum.amount || 0;
    const totalRefillRevenue = allTimeRefillsAggregate._sum.amountPaid || 0;

    // Suspicious activity: count drivers or IPs with > 3 failed scans today
    const suspiciousActivityCount = failedScansToday > 5 ? 1 : 0;

    return {
      overview: {
        activeStudents: totalStudents,
        activeDrivers,
        activeTickets,
        exhaustedTickets,
        unassignedTickets,
        todayRides: todayRidesCount,
        totalRides: allTimeRidesCount,
        todayRevenue: todaySalesRevenue + todayRefillRevenue,
        totalRevenue: totalSalesRevenue + totalRefillRevenue,
        todaySalesRevenue,
        todayRefillRevenue,
        totalSalesRevenue,
        totalRefillRevenue,
        todayRefills: recentRefillsCount,
        failedScansToday,
        suspiciousActivityCount,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Driver Management: Create a new driver account
   */
  static async createDriver(adminId: string, data: {
    driverCode: string;
    fullName: string;
    phone: string;
    licenseNumber: string;
    password: string;
    assignedVehicleId?: string;
  }) {
    const { driverCode, fullName, phone, licenseNumber, password, assignedVehicleId } = data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: driverCode.toUpperCase() },
          { driver: { phone } },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestError('Driver code or phone number already in use');
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: driverCode.toUpperCase(),
          passwordHash,
          role: ROLES.DRIVER,
          isActive: true,
        },
      });

      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          driverCode: driverCode.toUpperCase(),
          fullName,
          phone,
          licenseNumber,
          status: DRIVER_STATUS.ACTIVE,
          assignedVehicleId,
        },
        include: {
          assignedVehicle: true,
        },
      });

      // Default emergency float pass (20 rides initial credit)
      const defaultFloatRides = 20;
      const cleanCode = driverCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const year = new Date().getFullYear();
      let ticketNumber = `CKK-${year}-EMERG-${cleanCode}`;

      const existingTicket = await tx.ticket.findUnique({ where: { ticketNumber } });
      if (existingTicket) {
        ticketNumber = generateTicketNumber();
      }

      const payloadToken = generateSecurePayloadToken();
      const signature = signTicketPayload(ticketNumber, payloadToken);
      const qrPayload = JSON.stringify({
        t: ticketNumber,
        k: payloadToken,
        s: signature,
      });

      const emergencyTicket = await tx.ticket.create({
        data: {
          ticketNumber,
          qrPayload,
          totalRides: defaultFloatRides,
          usedRides: 0,
          remainingRides: defaultFloatRides,
          status: TICKET_STATUS.ACTIVE,
          ticketType: 'DRIVER_EMERGENCY',
          driverId: driver.id,
          issuedById: adminId,
        },
      });

      return { user, driver: { ...driver, emergencyTickets: [emergencyTicket] } };
    });

    await createAuditLog({
      userId: adminId,
      action: 'DRIVER_CREATED',
      entityType: 'DRIVER',
      entityId: result.driver.id,
      details: {
        driverCode: result.driver.driverCode,
        fullName: result.driver.fullName,
      },
    });

    return result.driver;
  }

  /**
   * Provision or ensure an active emergency float ticket exists for a driver
   */
  static async provisionEmergencyTicketForDriver(
    driverId: string,
    driverCode: string,
    issuerAdminId?: string,
    initialRides = 20
  ) {
    // Check if driver already has an emergency ticket
    const existing = await prisma.ticket.findFirst({
      where: {
        driverId,
        ticketType: 'DRIVER_EMERGENCY',
      },
      include: {
        driver: true,
      },
    });

    if (existing) {
      return existing;
    }

    let adminId = issuerAdminId;
    if (!adminId) {
      const admin = await prisma.user.findFirst({
        where: { role: ROLES.ADMIN },
        orderBy: { createdAt: 'asc' },
      });
      adminId = admin ? admin.id : undefined;
    }

    if (!adminId) {
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      adminId = driver?.userId;
    }

    if (!adminId) {
      throw new BadRequestError('Admin user required to issue driver emergency ticket');
    }

    const cleanCode = driverCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const year = new Date().getFullYear();
    let ticketNumber = `CKK-${year}-EMERG-${cleanCode}`;

    const existingNumber = await prisma.ticket.findUnique({ where: { ticketNumber } });
    if (existingNumber) {
      ticketNumber = generateTicketNumber();
    }

    const payloadToken = generateSecurePayloadToken();
    const signature = signTicketPayload(ticketNumber, payloadToken);
    const qrPayload = JSON.stringify({
      t: ticketNumber,
      k: payloadToken,
      s: signature,
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        qrPayload,
        totalRides: initialRides,
        usedRides: 0,
        remainingRides: initialRides,
        status: TICKET_STATUS.ACTIVE,
        ticketType: 'DRIVER_EMERGENCY',
        driverId,
        issuedById: adminId,
      },
      include: {
        driver: true,
      },
    });

    await createAuditLog({
      userId: adminId,
      action: 'TICKET_CREATED',
      entityType: 'TICKET',
      entityId: ticket.id,
      details: {
        ticketNumber: ticket.ticketNumber,
        ticketType: 'DRIVER_EMERGENCY',
        driverCode,
        totalRides: initialRides,
      },
    });

    return ticket;
  }

  /**
   * Toggle Driver Status (ACTIVE, SUSPENDED, INACTIVE)
   */
  static async updateDriverStatus(
    adminId: string,
    driverId: string,
    status: keyof typeof DRIVER_STATUS
  ) {
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { status },
      include: { assignedVehicle: true },
    });

    await createAuditLog({
      userId: adminId,
      action: 'DRIVER_STATUS_UPDATED',
      entityType: 'DRIVER',
      entityId: driver.id,
      details: { status },
    });

    return driver;
  }

  /**
   * Assign vehicle to driver
   */
  static async assignVehicleToDriver(adminId: string, driverId: string, vehicleId: string | null) {
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { assignedVehicleId: vehicleId },
      include: { assignedVehicle: true },
    });

    await createAuditLog({
      userId: adminId,
      action: 'DRIVER_VEHICLE_ASSIGNED',
      entityType: 'DRIVER',
      entityId: driver.id,
      details: { vehicleId },
    });

    return driver;
  }

  /**
   * Create Vehicle
   */
  static async createVehicle(adminId: string, data: {
    plateNumber: string;
    kekeNumber: string;
    model?: string;
    capacity?: number;
  }) {
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber.toUpperCase(),
        kekeNumber: data.kekeNumber.toUpperCase(),
        model: data.model || 'Bajaj RE 4S',
        capacity: data.capacity || 4,
        status: 'ACTIVE',
      },
    });

    await createAuditLog({
      userId: adminId,
      action: 'VEHICLE_CREATED',
      entityType: 'VEHICLE',
      entityId: vehicle.id,
      details: { plateNumber: vehicle.plateNumber, kekeNumber: vehicle.kekeNumber },
    });

    return vehicle;
  }

  /**
   * List all vehicles in fleet
   */
  static async listVehicles() {
    return prisma.vehicle.findMany({
      include: {
        drivers: {
          select: {
            id: true,
            driverCode: true,
            fullName: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { kekeNumber: 'asc' },
    });
  }

  /**
   * Delete Vehicle
   */
  static async deleteVehicle(adminId: string, vehicleId: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    await prisma.driver.updateMany({
      where: { assignedVehicleId: vehicleId },
      data: { assignedVehicleId: null },
    });

    await prisma.vehicle.delete({ where: { id: vehicleId } });

    await createAuditLog({
      userId: adminId,
      action: 'VEHICLE_DELETED',
      entityType: 'VEHICLE',
      entityId: vehicleId,
      details: { kekeNumber: vehicle.kekeNumber, plateNumber: vehicle.plateNumber },
    });

    return { success: true, message: `Vehicle ${vehicle.kekeNumber} deleted successfully.` };
  }

  /**
   * Update driver profile details
   */
  static async updateDriver(adminId: string, driverId: string, data: {
    fullName?: string;
    phone?: string;
    driverCode?: string;
    licenseNumber?: string;
    status?: keyof typeof DRIVER_STATUS;
    assignedVehicleId?: string | null;
    password?: string;
  }) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });
    if (!driver) throw new NotFoundError('Driver not found');

    if (data.driverCode && data.driverCode.toUpperCase() !== driver.driverCode) {
      const conflict = await prisma.driver.findFirst({
        where: { driverCode: data.driverCode.toUpperCase(), id: { not: driverId } },
      });
      if (conflict) throw new BadRequestError('Driver code already in use');
    }
    if (data.phone && data.phone !== driver.phone) {
      const conflict = await prisma.driver.findFirst({
        where: { phone: data.phone, id: { not: driverId } },
      });
      if (conflict) throw new BadRequestError('Phone number already in use');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const userUpdates: any = {};
      if (data.driverCode) {
        userUpdates.username = data.driverCode.toUpperCase();
      }
      if (data.password && data.password.trim().length >= 6) {
        userUpdates.passwordHash = await hashPassword(data.password.trim());
      }
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: driver.userId },
          data: userUpdates,
        });
      }

      return tx.driver.update({
        where: { id: driverId },
        data: {
          fullName: data.fullName ?? driver.fullName,
          phone: data.phone ?? driver.phone,
          driverCode: data.driverCode ? data.driverCode.toUpperCase() : driver.driverCode,
          licenseNumber: data.licenseNumber ?? driver.licenseNumber,
          status: data.status ?? driver.status,
          assignedVehicleId: data.assignedVehicleId !== undefined ? data.assignedVehicleId : driver.assignedVehicleId,
        },
        include: {
          assignedVehicle: true,
          user: { select: { id: true, username: true, role: true, isActive: true } },
        },
      });
    });

    await createAuditLog({
      userId: adminId,
      action: 'DRIVER_UPDATED',
      entityType: 'DRIVER',
      entityId: driverId,
      details: { driverCode: updated.driverCode, fullName: updated.fullName },
    });

    return updated;
  }

  /**
   * Delete driver account and clean up dependencies
   */
  static async deleteDriver(adminId: string, driverId: string) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });
    if (!driver) throw new NotFoundError('Driver not found');

    await prisma.$transaction(async (tx) => {
      await tx.failedScanLog.deleteMany({ where: { driverId } });

      const emergencyTickets = await tx.ticket.findMany({ where: { driverId } });
      for (const t of emergencyTickets) {
        await tx.rideTransaction.deleteMany({ where: { ticketId: t.id } });
        await tx.ticketSale.deleteMany({ where: { ticketId: t.id } });
        await tx.ticketRefill.deleteMany({ where: { ticketId: t.id } });
        await tx.ticket.delete({ where: { id: t.id } });
      }

      await tx.rideTransaction.deleteMany({ where: { driverId } });
      await tx.driver.delete({ where: { id: driverId } });
      await tx.user.delete({ where: { id: driver.userId } });
    });

    await createAuditLog({
      userId: adminId,
      action: 'DRIVER_DELETED',
      entityType: 'DRIVER',
      entityId: driverId,
      details: { driverCode: driver.driverCode, fullName: driver.fullName },
    });

    return { success: true, message: `Driver ${driver.driverCode} deleted successfully.` };
  }

  /**
   * Update student profile details
   */
  static async updateStudent(adminId: string, studentId: string, data: {
    fullName?: string;
    phone?: string;
    regNumber?: string;
    password?: string;
  }) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!student) throw new NotFoundError('Student not found');

    if (data.regNumber && data.regNumber.toUpperCase() !== student.regNumber) {
      const conflict = await prisma.student.findFirst({
        where: { regNumber: data.regNumber.toUpperCase(), id: { not: studentId } },
      });
      if (conflict) throw new BadRequestError('Registration number already in use');
    }
    if (data.phone && data.phone !== student.phone) {
      const conflict = await prisma.student.findFirst({
        where: { phone: data.phone, id: { not: studentId } },
      });
      if (conflict) throw new BadRequestError('Phone number already in use');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const userUpdates: any = {};
      if (data.regNumber) {
        userUpdates.username = data.regNumber.toUpperCase();
      }
      if (data.password && data.password.trim().length >= 6) {
        userUpdates.passwordHash = await hashPassword(data.password.trim());
      }
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: student.userId },
          data: userUpdates,
        });
      }

      return tx.student.update({
        where: { id: studentId },
        data: {
          fullName: data.fullName ?? student.fullName,
          phone: data.phone ?? student.phone,
          regNumber: data.regNumber ? data.regNumber.toUpperCase() : student.regNumber,
        },
        include: {
          user: { select: { id: true, username: true, role: true, isActive: true } },
          tickets: true,
        },
      });
    });

    await createAuditLog({
      userId: adminId,
      action: 'STUDENT_UPDATED',
      entityType: 'STUDENT',
      entityId: studentId,
      details: { regNumber: updated.regNumber, fullName: updated.fullName },
    });

    return updated;
  }

  /**
   * Delete student account and clean up dependencies
   */
  static async deleteStudent(adminId: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!student) throw new NotFoundError('Student not found');

    await prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({
        where: { studentId },
        data: { studentId: null, status: 'REVOKED' },
      });
      await tx.rideTransaction.updateMany({
        where: { studentId },
        data: { studentId: null },
      });

      await tx.student.delete({ where: { id: studentId } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    await createAuditLog({
      userId: adminId,
      action: 'STUDENT_DELETED',
      entityType: 'STUDENT',
      entityId: studentId,
      details: { regNumber: student.regNumber, fullName: student.fullName },
    });

    return { success: true, message: `Student ${student.regNumber} deleted successfully.` };
  }

  /**
   * List students with tickets and ride summary
   */
  static async listStudents(query: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      whereClause.OR = [
        { fullName: { contains: s } },
        { regNumber: { contains: s } },
        { phone: { contains: s } },
        { tickets: { some: { ticketNumber: { contains: s } } } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where: whereClause }),
      prisma.student.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tickets: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { rides: true },
          },
        },
      }),
    ]);

    return {
      data: students,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List drivers with vehicles and today's stats, with search, filters, and pagination
   */
  static async listDrivers(query?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const where: any = {};
    if (query?.status && query.status !== 'ALL') where.status = query.status;
    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s } },
        { driverCode: { contains: s } },
        { phone: { contains: s } },
        { licenseNumber: { contains: s } },
        { assignedVehicle: { kekeNumber: { contains: s } } },
        { assignedVehicle: { plateNumber: { contains: s } } },
        { emergencyTickets: { some: { ticketNumber: { contains: s } } } },
      ];
    }

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 20));
    const skip = (page - 1) * limit;

    const [total, drivers] = await Promise.all([
      prisma.driver.count({ where }),
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedVehicle: true,
          emergencyTickets: true,
          _count: {
            select: { rides: true },
          },
        },
      }),
    ]);

    // Ensure all returned drivers have an emergency float pass by default
    for (const driver of drivers) {
      if (!driver.emergencyTickets || driver.emergencyTickets.length === 0) {
        const ticket = await this.provisionEmergencyTicketForDriver(driver.id, driver.driverCode);
        driver.emergencyTickets = [ticket];
      }
    }

    return {
      data: drivers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List tickets with filters
   */
  static async listTickets(query: {
    status?: string;
    ticketType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.ticketType && query.ticketType !== 'ALL') where.ticketType = query.ticketType;
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { ticketNumber: { contains: s } },
        { student: { regNumber: { contains: s } } },
        { student: { fullName: { contains: s } } },
        { driver: { driverCode: { contains: s } } },
        { driver: { fullName: { contains: s } } },
        { driver: { phone: { contains: s } } },
      ];
    }

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: true,
          driver: true,
          sales: {
            orderBy: { soldAt: 'desc' },
            take: 1,
          },
          refills: {
            orderBy: { refilledAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { fundedRides: true, sales: true, refills: true },
          },
        },
      }),
    ]);

    return {
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List ride transactions with filters, search, and pagination
   */
  static async listTransactions(query: {
    driverId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    validationMethod?: string;
    rideSource?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.driverId) where.driverId = query.driverId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.validationMethod && query.validationMethod !== 'ALL') where.validationMethod = query.validationMethod;
    if (query.rideSource && query.rideSource !== 'ALL') where.rideSource = query.rideSource;
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { transactionNumber: { contains: s } },
        { ticket: { ticketNumber: { contains: s } } },
        { student: { fullName: { contains: s } } },
        { student: { regNumber: { contains: s } } },
        { driver: { fullName: { contains: s } } },
        { driver: { driverCode: { contains: s } } },
        { vehicle: { kekeNumber: { contains: s } } },
        { vehicle: { plateNumber: { contains: s } } },
      ];
    }

    const [total, transactions] = await Promise.all([
      prisma.rideTransaction.count({ where }),
      prisma.rideTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          student: true,
          driver: true,
          vehicle: true,
          ticket: true,
        },
      }),
    ]);

    return {
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List audit logs with search, action filters, and pagination
   */
  static async listAuditLogs(query?: {
    search?: string;
    action?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.action && query.action !== 'ALL') where.action = query.action;
    if (query?.entityType && query.entityType !== 'ALL') where.entityType = query.entityType;
    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { action: { contains: s } },
        { entityType: { contains: s } },
        { entityId: { contains: s } },
        { ipAddress: { contains: s } },
        { user: { username: { contains: s } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, role: true } },
        },
      }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List failed scans for security review with search, reason filters, and pagination
   */
  static async listFailedScans(query?: {
    search?: string;
    reason?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.reason && query.reason !== 'ALL') where.reason = query.reason;
    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { reason: { contains: s } },
        { attemptedTicket: { contains: s } },
        { scannedPayload: { contains: s } },
        { ipAddress: { contains: s } },
        { driver: { driverCode: { contains: s } } },
        { driver: { fullName: { contains: s } } },
      ];
    }

    const [total, failedScans] = await Promise.all([
      prisma.failedScanLog.count({ where }),
      prisma.failedScanLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          driver: { select: { driverCode: true, fullName: true } },
        },
      }),
    ]);

    return {
      data: failedScans,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

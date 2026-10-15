import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/crypto';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors';
import { ROLES, TICKET_STATUS } from '../config';
import { createAuditLog } from '../utils/audit';

export interface StudentRegistrationInput {
  regNumber: string;
  fullName: string;
  phone: string;
  ticketId: string; // Ticket number, e.g. CKK-2026-XXXX
  password: string;
}

export interface LoginInput {
  identifier: string; // Reg number, driver code, username, or email
  password: string;
}

export class AuthService {
  /**
   * Register a student using their admin-issued ticket.
   * Requirement: "A student must purchase their first ticket from an admin before they can register or log in."
   */
  static async registerStudent(input: StudentRegistrationInput, ipAddress?: string) {
    const { regNumber, fullName, phone, ticketId, password } = input;

    // 1. Check if regNumber or phone already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [{ regNumber }, { phone }],
      },
    });

    if (existingStudent) {
      if (existingStudent.regNumber === regNumber) {
        throw new ConflictError(`Student with registration number '${regNumber}' is already registered.`);
      }
      throw new ConflictError(`Student with phone number '${phone}' is already registered.`);
    }

    // 2. Validate ticket exists, is UNASSIGNED, and has remaining rides
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: ticketId.trim().toUpperCase(),
      },
    });

    if (!ticket) {
      throw new BadRequestError('Invalid Ticket ID. The ticket does not exist in the system.');
    }

    if (ticket.ticketType !== 'STUDENT') {
      throw new BadRequestError('This ticket cannot be used for student registration (not a student ticket).');
    }

    if (ticket.studentId) {
      throw new ConflictError('This ticket has already been claimed by another student.');
    }

    if (ticket.status !== TICKET_STATUS.UNASSIGNED && ticket.status !== TICKET_STATUS.ACTIVE) {
      throw new BadRequestError(`This ticket cannot be registered. Current status: ${ticket.status}`);
    }

    if (ticket.remainingRides <= 0) {
      throw new BadRequestError('This ticket has 0 remaining rides and cannot be used for registration.');
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create User, Student profile, and assign Ticket in an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account with username = regNumber
      const user = await tx.user.create({
        data: {
          username: regNumber.toUpperCase(),
          passwordHash,
          role: ROLES.STUDENT,
          isActive: true,
        },
      });

      // Create student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          regNumber: regNumber.toUpperCase(),
          fullName,
          phone,
        },
      });

      // Assign ticket to student and activate status
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          studentId: student.id,
          status: TICKET_STATUS.ACTIVE,
        },
      });

      return { user, student, ticket: updatedTicket };
    });

    // 5. Audit log
    await createAuditLog({
      userId: result.user.id,
      action: 'STUDENT_REGISTERED',
      entityType: 'STUDENT',
      entityId: result.student.id,
      details: {
        regNumber: result.student.regNumber,
        fullName: result.student.fullName,
        ticketNumber: result.ticket.ticketNumber,
      },
      ipAddress,
    });

    // 6. Generate tokens
    const tokenPayload: TokenPayload = {
      userId: result.user.id,
      role: ROLES.STUDENT,
      username: result.user.username,
      studentId: result.student.id,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
      },
      student: {
        id: result.student.id,
        regNumber: result.student.regNumber,
        fullName: result.student.fullName,
        phone: result.student.phone,
      },
      ticket: {
        ticketNumber: result.ticket.ticketNumber,
        remainingRides: result.ticket.remainingRides,
        totalRides: result.ticket.totalRides,
        status: result.ticket.status,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Universal Login for Admin, Driver, and Student
   */
  static async login(input: LoginInput, ipAddress?: string) {
    const { identifier, password } = input;
    const cleanId = identifier.trim();

    // Find user by username, email, student regNumber, or driverCode
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanId.toUpperCase() },
          { username: cleanId },
          { email: cleanId.toLowerCase() },
          {
            student: {
              OR: [
                { regNumber: cleanId.toUpperCase() },
                { phone: cleanId },
              ],
            },
          },
          {
            driver: {
              OR: [
                { driverCode: cleanId.toUpperCase() },
                { phone: cleanId },
              ],
            },
          },
        ],
      },
      include: {
        student: {
          include: {
            tickets: {
              where: { status: { in: [TICKET_STATUS.ACTIVE, TICKET_STATUS.EXHAUSTED] } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        driver: {
          include: {
            assignedVehicle: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials. Please check your login details.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated. Please contact campus transport administration.');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials. Please check your login details.');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role as any,
      username: user.username,
      studentId: user.student?.id,
      driverId: user.driver?.id,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      details: { role: user.role, username: user.username },
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      student: user.student ? {
        id: user.student.id,
        regNumber: user.student.regNumber,
        fullName: user.student.fullName,
        phone: user.student.phone,
        activeTicket: user.student.tickets[0] || null,
      } : null,
      driver: user.driver ? {
        id: user.driver.id,
        driverCode: user.driver.driverCode,
        fullName: user.driver.fullName,
        phone: user.driver.phone,
        status: user.driver.status,
        vehicle: user.driver.assignedVehicle,
      } : null,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh Access Token
   */
  static async refresh(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { student: true, driver: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid user session');
      }

      const newPayload: TokenPayload = {
        userId: user.id,
        role: user.role as any,
        username: user.username,
        studentId: user.student?.id,
        driverId: user.driver?.id,
      };

      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Fetch current authenticated user profile
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: {
          include: {
            tickets: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        driver: {
          include: {
            assignedVehicle: true,
            emergencyTickets: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}

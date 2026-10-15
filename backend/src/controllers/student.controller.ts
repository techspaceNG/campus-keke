import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { TicketService } from '../services/ticket.service';

export class StudentController {
  /**
   * Get Student Dashboard Data
   * Ticket ID, QR code, total rides, used rides, remaining rides, recent trips
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new NotFoundError('Student profile not found for this user.');
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          tickets: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          rides: {
            take: 10,
            orderBy: { timestamp: 'desc' },
            include: {
              driver: { select: { fullName: true, driverCode: true } },
              vehicle: { select: { kekeNumber: true, plateNumber: true } },
            },
          },
        },
      });

      if (!student) {
        throw new NotFoundError('Student not found.');
      }

      // Current active ticket (or most recent exhausted ticket)
      const currentTicket = student.tickets.find((t) => t.status === 'ACTIVE') || student.tickets[0] || null;

      let qrDataUrl: string | null = null;
      if (currentTicket) {
        qrDataUrl = await TicketService.generateQrDataUrl(currentTicket.qrPayload);
      }

      res.status(200).json({
        success: true,
        data: {
          student: {
            id: student.id,
            fullName: student.fullName,
            regNumber: student.regNumber,
            phone: student.phone,
          },
          ticket: currentTicket ? {
            id: currentTicket.id,
            ticketNumber: currentTicket.ticketNumber,
            status: currentTicket.status,
            totalRides: currentTicket.totalRides,
            usedRides: currentTicket.usedRides,
            remainingRides: currentTicket.remainingRides,
            createdAt: currentTicket.createdAt,
            qrDataUrl,
            qrPayload: currentTicket.qrPayload,
          } : null,
          allTickets: student.tickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            status: t.status,
            totalRides: t.totalRides,
            usedRides: t.usedRides,
            remainingRides: t.remainingRides,
            createdAt: t.createdAt,
          })),
          recentRides: student.rides,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

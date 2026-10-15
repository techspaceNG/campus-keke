import QRCode from 'qrcode';
import { prisma } from '../utils/prisma';
import {
  generateTicketNumber,
  generateSecurePayloadToken,
  signTicketPayload,
} from '../utils/crypto';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { TICKET_STATUS, PAYMENT_METHODS } from '../config';
import { createAuditLog } from '../utils/audit';

export interface CreateTicketInput {
  totalRides: number;
  ticketType?: 'STUDENT' | 'DRIVER_EMERGENCY';
  driverId?: string; // If creating driver emergency ticket
  expiresInDays?: number;
}

export interface SellTicketInput {
  ticketId?: string; // If selling pre-generated ticket
  totalRides: number; // If generating on-the-spot
  amount: number;
  paymentMethod: keyof typeof PAYMENT_METHODS;
  paymentReference?: string;
  buyerName: string;
  buyerRegNumber?: string;
  buyerPhone?: string;
  notes?: string;
}

export interface RefillTicketInput {
  ticketId: string;
  ridesToAdd: number;
  amountPaid: number;
  paymentMethod: keyof typeof PAYMENT_METHODS;
  paymentReference?: string;
  notes?: string;
}

export class TicketService {
  /**
   * Admin creates a new ticket (unassigned)
   */
  static async createTicket(adminId: string, input: CreateTicketInput) {
    if (input.totalRides <= 0) {
      throw new BadRequestError('Total rides must be greater than zero');
    }

    const ticketNumber = generateTicketNumber();
    const payloadToken = generateSecurePayloadToken();
    const signature = signTicketPayload(ticketNumber, payloadToken);

    // Payload formatted as JSON string containing ticket number, token, and cryptographic signature
    const qrPayload = JSON.stringify({
      t: ticketNumber,
      k: payloadToken,
      s: signature,
    });

    let expiresAt: Date | undefined;
    if (input.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
    }

    const isDriverEmergency = input.ticketType === 'DRIVER_EMERGENCY';

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        qrPayload,
        totalRides: input.totalRides,
        usedRides: 0,
        remainingRides: input.totalRides,
        status: isDriverEmergency ? TICKET_STATUS.ACTIVE : TICKET_STATUS.UNASSIGNED,
        ticketType: input.ticketType || 'STUDENT',
        driverId: isDriverEmergency ? input.driverId : undefined,
        issuedById: adminId,
        expiresAt,
      },
      include: {
        driver: true,
        student: true,
      },
    });

    await createAuditLog({
      userId: adminId,
      action: 'TICKET_CREATED',
      entityType: 'TICKET',
      entityId: ticket.id,
      details: {
        ticketNumber: ticket.ticketNumber,
        totalRides: ticket.totalRides,
        type: ticket.ticketType,
      },
    });

    return ticket;
  }

  /**
   * Admin creates and records a ticket sale
   */
  static async sellTicket(adminId: string, input: SellTicketInput) {
    const {
      amount,
      paymentMethod,
      paymentReference,
      buyerName,
      buyerRegNumber,
      buyerPhone,
      notes,
    } = input;

    let targetTicket;

    if (input.ticketId) {
      targetTicket = await prisma.ticket.findUnique({
        where: { id: input.ticketId },
      });
      if (!targetTicket) {
        throw new NotFoundError('Specified ticket not found');
      }
    } else {
      // Create new ticket for this sale
      targetTicket = await this.createTicket(adminId, {
        totalRides: input.totalRides,
        ticketType: 'STUDENT',
      });
    }

    const sale = await prisma.$transaction(async (tx) => {
      const recordedSale = await tx.ticketSale.create({
        data: {
          ticketId: targetTicket.id,
          adminId,
          amount,
          ridesPurchased: targetTicket.totalRides,
          paymentMethod,
          paymentReference,
          buyerName,
          buyerRegNumber: buyerRegNumber?.toUpperCase(),
          buyerPhone,
          notes,
        },
      });

      return recordedSale;
    });

    await createAuditLog({
      userId: adminId,
      action: 'TICKET_SOLD',
      entityType: 'TICKET',
      entityId: targetTicket.id,
      details: {
        saleId: sale.id,
        amount,
        paymentMethod,
        buyerName,
        buyerRegNumber,
        ticketNumber: targetTicket.ticketNumber,
      },
    });

    return {
      ticket: targetTicket,
      sale,
    };
  }

  /**
   * Admin refills an existing ticket
   * "Refilling an exhausted ticket reactivates it while preserving its original Ticket ID, QR code, and student account."
   */
  static async refillTicket(adminId: string, input: RefillTicketInput) {
    const { ticketId, ridesToAdd, amountPaid, paymentMethod, paymentReference, notes } = input;

    if (ridesToAdd <= 0) {
      throw new BadRequestError('Rides to add must be greater than zero');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { student: true, driver: true },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (ticket.status === TICKET_STATUS.REVOKED) {
      throw new BadRequestError('Revoked tickets cannot be refilled');
    }

    const previousBalance = ticket.remainingRides;
    const newRemainingRides = previousBalance + ridesToAdd;
    const newTotalRides = ticket.totalRides + ridesToAdd;

    const result = await prisma.$transaction(async (tx) => {
      // Reactivate ticket if exhausted
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          totalRides: newTotalRides,
          remainingRides: newRemainingRides,
          status: TICKET_STATUS.ACTIVE, // Reactivate!
        },
        include: { student: true, driver: true },
      });

      const refillRecord = await tx.ticketRefill.create({
        data: {
          ticketId,
          adminId,
          ridesAdded: ridesToAdd,
          previousBalance,
          newBalance: newRemainingRides,
          amountPaid,
          paymentMethod,
          paymentReference,
          notes,
        },
      });

      return { ticket: updatedTicket, refillRecord };
    });

    await createAuditLog({
      userId: adminId,
      action: 'TICKET_REFILLED',
      entityType: 'TICKET',
      entityId: ticket.id,
      details: {
        ridesAdded: ridesToAdd,
        previousBalance,
        newBalance: newRemainingRides,
        amountPaid,
        ticketNumber: ticket.ticketNumber,
        ticketType: ticket.ticketType,
        studentReg: ticket.student?.regNumber,
        driverCode: ticket.driver?.driverCode,
      },
    });

    return result;
  }

  /**
   * Update ticket status (SUSPEND, ACTIVATE, REVOKE)
   */
  static async updateTicketStatus(
    adminId: string,
    ticketId: string,
    newStatus: keyof typeof TICKET_STATUS,
    reason?: string
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus },
    });

    await createAuditLog({
      userId: adminId,
      action: 'TICKET_STATUS_UPDATED',
      entityType: 'TICKET',
      entityId: ticket.id,
      details: {
        oldStatus: ticket.status,
        newStatus,
        reason,
        ticketNumber: ticket.ticketNumber,
      },
    });

    return updated;
  }

  /**
   * Generate QR code Data URL (PNG base64) for a ticket
   */
  static async generateQrDataUrl(qrPayload: string): Promise<string> {
    return QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    });
  }

  /**
   * Get single ticket by ID or Number
   */
  static async getTicketDetails(identifier: string) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id: identifier },
          { ticketNumber: identifier.toUpperCase() },
          { driver: { driverCode: identifier.toUpperCase() } },
          { student: { regNumber: identifier.toUpperCase() } },
        ],
      },
      include: {
        student: true,
        driver: true,
        sales: {
          orderBy: { soldAt: 'desc' },
          include: { admin: { select: { username: true, email: true } } },
        },
        refills: {
          orderBy: { refilledAt: 'desc' },
          include: { admin: { select: { username: true, email: true } } },
        },
        fundedRides: {
          take: 20,
          orderBy: { timestamp: 'desc' },
          include: {
            driver: true,
            vehicle: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    const qrDataUrl = await this.generateQrDataUrl(ticket.qrPayload);

    return {
      ...ticket,
      qrDataUrl,
    };
  }
}

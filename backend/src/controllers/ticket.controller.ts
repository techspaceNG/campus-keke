import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { TicketService } from '../services/ticket.service';

export const createTicketSchema = {
  body: z.object({
    totalRides: z.number().int().min(1).max(500),
    ticketType: z.enum(['STUDENT', 'DRIVER_EMERGENCY']).default('STUDENT'),
    driverId: z.string().optional(),
    expiresInDays: z.number().int().min(1).max(365).optional(),
  }),
};

export const sellTicketSchema = {
  body: z.object({
    ticketId: z.string().optional(),
    totalRides: z.number().int().min(1).max(500).default(10),
    amount: z.number().positive(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'POS', 'OTHER']).default('CASH'),
    paymentReference: z.string().optional(),
    buyerName: z.string().min(2),
    buyerRegNumber: z.string().optional(),
    buyerPhone: z.string().optional(),
    notes: z.string().optional(),
  }),
};

export const refillTicketSchema = {
  body: z.object({
    ticketId: z.string().min(1),
    ridesToAdd: z.number().int().min(1).max(500),
    amountPaid: z.number().min(0),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'POS', 'OTHER']).default('CASH'),
    paymentReference: z.string().optional(),
    notes: z.string().optional(),
  }),
};

export const updateStatusSchema = {
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'REVOKED']),
    reason: z.string().optional(),
  }),
};

export class TicketController {
  static async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.createTicket(req.user!.userId, req.body);
      const qrDataUrl = await TicketService.generateQrDataUrl(ticket.qrPayload);
      res.status(201).json({
        success: true,
        data: {
          ...ticket,
          qrDataUrl,
        },
        message: 'Ticket successfully created.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async sellTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await TicketService.sellTicket(req.user!.userId, req.body);
      const qrDataUrl = await TicketService.generateQrDataUrl(result.ticket.qrPayload);
      res.status(201).json({
        success: true,
        data: {
          ...result,
          ticket: {
            ...result.ticket,
            qrDataUrl,
          },
        },
        message: 'Ticket sale recorded successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async refillTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await TicketService.refillTicket(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        data: result,
        message: `Ticket refilled with ${req.body.ridesToAdd} rides and reactivated.`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await TicketService.updateTicketStatus(
        req.user!.userId,
        String(req.params.id),
        req.body.status,
        req.body.reason
      );
      res.status(200).json({
        success: true,
        data: result,
        message: `Ticket status updated to ${req.body.status}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.getTicketDetails(String(req.params.identifier));
      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }
}

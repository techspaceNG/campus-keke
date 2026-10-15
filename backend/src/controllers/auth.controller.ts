import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth';

export const registerSchema = {
  body: z.object({
    regNumber: z.string().min(3).max(30),
    fullName: z.string().min(2).max(100),
    phone: z.string().min(7).max(20),
    ticketId: z.string().min(6).max(40),
    password: z.string().min(6).max(100),
  }),
};

export const loginSchema = {
  body: z.object({
    identifier: z.string().min(1),
    password: z.string().min(1),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1),
  }),
};

export class AuthController {
  static async registerStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerStudent(req.body, req.ip);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Student account created and ticket activated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body, req.ip);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.user!.userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

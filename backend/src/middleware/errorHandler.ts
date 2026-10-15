import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Operational App Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(', ')
        : String(err.meta?.target || 'field');
      res.status(409).json({
        success: false,
        error: {
          message: `A record with this ${target} already exists.`,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Requested record was not found in the database.',
          code: 'RECORD_NOT_FOUND',
        },
      });
      return;
    }
  }

  // Syntax errors (e.g. malformed JSON in body)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Malformed JSON payload in request body.',
      },
    });
    return;
  }

  // Unexpected errors
  console.error('Unhandled internal error:', err);
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: {
      message: err?.message || 'An internal server error occurred.',
      details: isProduction ? undefined : { stack: err.stack },
      code: err?.code || 'INTERNAL_ERROR',
    },
  });
}

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CONFIG } from './config';
import v1Router from './routes';
import { standardRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './utils/prisma';

export function createApp(): Application {
  const app = express();

  // Trust reverse proxy (essential for Vercel, Render, Cloudflare, rate limiting)
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. same-origin rewrites, mobile clients, internal service calls)
        if (!origin) return callback(null, true);
        if (
          origin === CONFIG.CORS_ORIGIN ||
          origin === 'http://localhost:3000' ||
          origin === 'http://127.0.0.1:3000' ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    })
  );

  // Request Logging
  if (CONFIG.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global Rate Limiting
  app.use(standardRateLimiter);

  // Health & diagnostics endpoint (accessible at any prefix)
  app.get(['/health', '/api/health', '/api/v1/health', '/v1/health'], async (req: Request, res: Response) => {
    let dbStatus = 'UNKNOWN';
    let dbError: string | null = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'CONNECTED';
    } catch (e: any) {
      dbStatus = 'ERROR';
      dbError = e.message;
    }

    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'campus-keke-backend',
      database: {
        status: dbStatus,
        hasDbUrl: Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')),
        error: dbError,
      },
      env: process.env.NODE_ENV || 'production',
    });
  });

  // Mount API Routes (support /api/v1, /v1, and / for all Vercel rewrite configurations)
  app.use('/api/v1', v1Router);
  app.use('/v1', v1Router);
  app.use('/', v1Router);

  // Fallback 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
      },
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

const defaultApp = createApp();

module.exports = defaultApp;
module.exports.default = defaultApp;
module.exports.createApp = createApp;

export default defaultApp;

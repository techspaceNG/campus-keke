import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import driverRoutes from './driver.routes';
import ticketRoutes from './ticket.routes';
import adminRoutes from './admin.routes';
import { prisma } from '../utils/prisma';

const v1Router = Router();

// Health Check Endpoint
v1Router.get('/health', async (req, res) => {
  try {
    // Database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: 'HEALTHY',
        api: 'HEALTHY',
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        database: 'UNHEALTHY',
        error: error.message,
      },
    });
  }
});

v1Router.use('/auth', authRoutes);
v1Router.use('/student', studentRoutes);
v1Router.use('/driver', driverRoutes);
v1Router.use('/tickets', ticketRoutes);
v1Router.use('/admin', adminRoutes);

export default v1Router;

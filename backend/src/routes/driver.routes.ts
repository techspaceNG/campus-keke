import { Router } from 'express';
import { DriverController, validateRideSchema } from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { ticketValidationRateLimiter } from '../middleware/rateLimiter';
import { ROLES } from '../config';

const router = Router();

// Driver Dashboard
router.get(
  '/dashboard',
  authenticate,
  requireRole(ROLES.DRIVER),
  DriverController.getDashboard
);

// Validate and Activate Ride (Both QR scanning and manual entry use this endpoint)
router.post(
  '/validate-ride',
  authenticate,
  requireRole(ROLES.DRIVER),
  ticketValidationRateLimiter,
  validate(validateRideSchema),
  DriverController.validateRide
);

export default router;

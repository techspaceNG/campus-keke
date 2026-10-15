import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ROLES } from '../config';

const router = Router();

// Student Dashboard (view ticket, QR code, total rides, used rides, remaining rides)
router.get(
  '/dashboard',
  authenticate,
  requireRole(ROLES.STUDENT),
  StudentController.getDashboard
);

export default router;

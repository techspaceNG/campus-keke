import { Router } from 'express';
import {
  AdminController,
  createDriverSchema,
  updateDriverStatusSchema,
  assignVehicleSchema,
  createVehicleSchema,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { ROLES } from '../config';

const router = Router();

// Enforce ADMIN role on all admin routes
router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/stats', AdminController.getDashboardStats);
router.post('/drivers', validate(createDriverSchema), AdminController.createDriver);
router.patch('/drivers/:id/status', validate(updateDriverStatusSchema), AdminController.updateDriverStatus);
router.patch('/drivers/:id/vehicle', validate(assignVehicleSchema), AdminController.assignVehicle);
router.post('/drivers/:id/emergency-ticket', AdminController.issueDriverEmergencyTicket);
router.post('/vehicles', validate(createVehicleSchema), AdminController.createVehicle);
router.get('/students', AdminController.listStudents);
router.get('/drivers', AdminController.listDrivers);
router.get('/tickets', AdminController.listTickets);
router.get('/transactions', AdminController.listTransactions);
router.get('/audit-logs', AdminController.listAuditLogs);
router.get('/failed-scans', AdminController.listFailedScans);

export default router;

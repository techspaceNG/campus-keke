import { Router } from 'express';
import {
  AdminController,
  createDriverSchema,
  updateDriverStatusSchema,
  updateDriverSchema,
  assignVehicleSchema,
  createVehicleSchema,
  updateStudentSchema,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { ROLES } from '../config';

const router = Router();

// Enforce ADMIN role on all admin routes
router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/stats', AdminController.getDashboardStats);

// Drivers
router.post('/drivers', validate(createDriverSchema), AdminController.createDriver);
router.patch('/drivers/:id', validate(updateDriverSchema), AdminController.updateDriver);
router.delete('/drivers/:id', AdminController.deleteDriver);
router.patch('/drivers/:id/status', validate(updateDriverStatusSchema), AdminController.updateDriverStatus);
router.patch('/drivers/:id/vehicle', validate(assignVehicleSchema), AdminController.assignVehicle);
router.post('/drivers/:id/emergency-ticket', AdminController.issueDriverEmergencyTicket);
router.get('/drivers', AdminController.listDrivers);

// Students
router.get('/students', AdminController.listStudents);
router.patch('/students/:id', validate(updateStudentSchema), AdminController.updateStudent);
router.delete('/students/:id', AdminController.deleteStudent);

// Vehicles
router.get('/vehicles', AdminController.listVehicles);
router.post('/vehicles', validate(createVehicleSchema), AdminController.createVehicle);
router.delete('/vehicles/:id', AdminController.deleteVehicle);

// Tickets & Audit
router.get('/tickets', AdminController.listTickets);
router.get('/transactions', AdminController.listTransactions);
router.get('/audit-logs', AdminController.listAuditLogs);
router.get('/failed-scans', AdminController.listFailedScans);

export default router;

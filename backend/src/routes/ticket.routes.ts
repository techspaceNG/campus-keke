import { Router } from 'express';
import {
  TicketController,
  createTicketSchema,
  sellTicketSchema,
  refillTicketSchema,
  updateStatusSchema,
} from '../controllers/ticket.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { ROLES } from '../config';

const router = Router();

// All ticket manipulation is strictly restricted to ADMIN
router.use(authenticate, requireRole(ROLES.ADMIN));

router.post(
  '/',
  validate(createTicketSchema),
  TicketController.createTicket
);

router.post(
  '/sell',
  validate(sellTicketSchema),
  TicketController.sellTicket
);

router.post(
  '/refill',
  validate(refillTicketSchema),
  TicketController.refillTicket
);

router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  TicketController.updateStatus
);

router.get(
  '/:identifier',
  TicketController.getDetails
);

export default router;

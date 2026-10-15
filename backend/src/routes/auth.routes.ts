import { Router } from 'express';
import {
  AuthController,
  registerSchema,
  loginSchema,
  refreshSchema,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  AuthController.registerStudent
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post(
  '/refresh',
  validate(refreshSchema),
  AuthController.refresh
);

router.get(
  '/me',
  authenticate,
  AuthController.getMe
);

export default router;

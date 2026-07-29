import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { changePassword, changePasswordSchema, login, loginSchema, logout, me } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Try again in a few minutes.' },
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.patch('/password', protect, validate(changePasswordSchema), changePassword);

export default router;

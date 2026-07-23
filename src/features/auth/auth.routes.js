import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, changePassword } from './auth.controller.js';
import { requireAuth } from '../../core/middlewares/auth.middleware.js';

// ─── Router ───
const router = Router();

// ─── Rate Limiting ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/change-password', requireAuth, changePassword);

export default router;

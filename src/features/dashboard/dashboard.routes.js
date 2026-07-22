import { Router } from 'express';
import { getMetrics } from './dashboard.controller.js';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware.js';

const router = Router();

router.get('/metrics', requireAuth, requireRole('manager', 'admin', 'staff', 'system_developer'), getMetrics);

export default router;

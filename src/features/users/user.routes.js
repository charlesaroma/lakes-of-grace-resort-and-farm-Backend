import { Router } from 'express';
import { getProfile } from './user.controller.js';
import { requireAuth } from '../../core/middlewares/auth.middleware.js';

const router = Router();
router.get('/me', requireAuth, getProfile);

export default router;

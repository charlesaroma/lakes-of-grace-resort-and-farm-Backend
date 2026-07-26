import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getOccupancy } from './cottage.controller.js';

const router = Router();

router.get('/occupancy', requireAuth, getOccupancy);

export default router;

import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getCheckIns, getCheckIn, createCheckIn, updateCheckIn, deleteCheckIn } from './checkin.controller.js';

const router = Router();

router.get('/', requireAuth, getCheckIns);
router.get('/:id', requireAuth, getCheckIn);
router.post('/', requireAuth, createCheckIn);
router.put('/:id', requireAuth, updateCheckIn);
router.delete('/:id', requireAuth, deleteCheckIn);

export default router;

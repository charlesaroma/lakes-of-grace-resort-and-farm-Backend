import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getGuests, getGuest, createGuest, updateGuest, deleteGuest } from './guest.controller.js';

const router = Router();

router.get('/', requireAuth, getGuests);
router.get('/:id', requireAuth, getGuest);
router.post('/', requireAuth, createGuest);
router.put('/:id', requireAuth, updateGuest);
router.delete('/:id', requireAuth, deleteGuest);

export default router;

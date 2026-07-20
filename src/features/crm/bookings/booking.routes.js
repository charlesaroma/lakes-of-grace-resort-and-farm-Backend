import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getBookings, getBooking, getRecentBookings, getRevenueStats, createBooking, updateBooking } from './booking.controller.js';

const router = Router();

router.get('/revenue/monthly', requireAuth, getRevenueStats);
router.get('/recent', requireAuth, getRecentBookings);
router.get('/:id', requireAuth, getBooking);
router.get('/', requireAuth, getBookings);
router.post('/', createBooking);
router.put('/:id', requireAuth, updateBooking);

export default router;

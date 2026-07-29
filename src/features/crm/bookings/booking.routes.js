import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getBookings, getBooking, getRecentBookings, getRevenueStats,
  createBooking, updateBooking,
  checkInRooms, inspectRoom, extendRoom, updateRoom, removeRoom,
} from './booking.controller.js';

const router = Router();

router.get('/revenue/monthly', requireAuth, getRevenueStats);
router.get('/recent', requireAuth, getRecentBookings);
router.get('/:id', requireAuth, getBooking);
router.get('/', requireAuth, getBookings);
router.post('/', createBooking);
router.put('/:id', requireAuth, updateBooking);

router.post('/:id/check-in', requireAuth, checkInRooms);
router.put('/:id/rooms/:roomIdx/inspect', requireAuth, inspectRoom);
router.put('/:id/rooms/:roomIdx/extend', requireAuth, extendRoom);
router.put('/:id/rooms/:roomIdx', requireAuth, updateRoom);
router.delete('/:id/rooms/:roomIdx', requireAuth, removeRoom);

export default router;

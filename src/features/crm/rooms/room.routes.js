import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getRooms, getRoom, createRoom, updateRoom, deleteRoom } from './room.controller.js';

const router = Router();

router.get('/', requireAuth, getRooms);
router.get('/:id', requireAuth, getRoom);
router.post('/', requireAuth, createRoom);
router.put('/:id', requireAuth, updateRoom);
router.delete('/:id', requireAuth, deleteRoom);

export default router;

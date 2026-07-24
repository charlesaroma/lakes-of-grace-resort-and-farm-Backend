import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getRoomCategories,
  getRoomCategory,
  createRoomCategory,
  updateRoomCategory,
  deleteRoomCategory,
} from './roomCategory.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getRoomCategories);
router.get('/:id', getRoomCategory);
router.post('/', createRoomCategory);
router.put('/:id', updateRoomCategory);
router.delete('/:id', deleteRoomCategory);

export default router;

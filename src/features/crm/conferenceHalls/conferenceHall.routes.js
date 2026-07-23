import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getPublicHalls,
  getHalls,
  getHall,
  createHall,
  updateHall,
  deleteHall,
} from './conferenceHall.controller.js';

const router = Router();

router.get('/public', getPublicHalls);

router.get('/', requireAuth, getHalls);
router.get('/:id', requireAuth, getHall);
router.post('/', requireAuth, createHall);
router.put('/:id', requireAuth, updateHall);
router.delete('/:id', requireAuth, deleteHall);

export default router;

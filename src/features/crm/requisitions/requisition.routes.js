import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getRequisitions,
  getRequisition,
  createRequisition,
  updateRequisition,
  approveRequisition,
  cancelRequisition,
  fulfillRequisition,
} from './requisition.controller.js';

// ─── Router ───
const router = Router();

router.get('/', requireAuth, getRequisitions);
router.get('/:id', requireAuth, getRequisition);
router.post('/', requireAuth, createRequisition);
router.put('/:id', requireAuth, updateRequisition);
router.post('/:id/approve', requireAuth, approveRequisition);
router.post('/:id/cancel', requireAuth, cancelRequisition);
router.post('/:id/fulfill', requireAuth, fulfillRequisition);

export default router;

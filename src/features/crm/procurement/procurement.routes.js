import { Router } from 'express';
import { requireAuth, requireRole } from '../../../core/middlewares/auth.middleware.js';
import {
  getProcurements,
  getProcurement,
  createProcurement,
  generateDrafts,
  updateProcurement,
  approveProcurement,
  orderProcurement,
  receiveProcurement,
  cancelProcurement,
  deleteProcurement,
} from './procurement.controller.js';

// ─── Router ───
const router = Router();

router.get('/', requireAuth, getProcurements);
router.get('/:id', requireAuth, getProcurement);
router.post('/', requireAuth, requireRole('admin', 'manager', 'kitchen_manager'), createProcurement);
router.post('/generate-drafts', requireAuth, requireRole('admin', 'manager'), generateDrafts);
router.put('/:id', requireAuth, requireRole('admin', 'manager', 'kitchen_manager'), updateProcurement);
router.post('/:id/approve', requireAuth, requireRole('admin', 'manager'), approveProcurement);
router.post('/:id/order', requireAuth, requireRole('admin', 'manager'), orderProcurement);
router.post('/:id/receive', requireAuth, requireRole('admin', 'manager', 'accountant'), receiveProcurement);
router.post('/:id/cancel', requireAuth, requireRole('admin', 'manager'), cancelProcurement);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProcurement);

export default router;

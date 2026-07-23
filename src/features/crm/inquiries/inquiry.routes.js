import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getInquiries, getInquiry, createInquiry, updateInquiry, deleteInquiry } from './inquiry.controller.js';

// ─── Router ───
const router = Router();

router.get('/', requireAuth, getInquiries);
router.get('/:id', requireAuth, getInquiry);
router.post('/', requireAuth, createInquiry);
router.put('/:id', requireAuth, updateInquiry);
router.delete('/:id', requireAuth, deleteInquiry);

export default router;

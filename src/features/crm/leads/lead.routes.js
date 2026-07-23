import { Router } from 'express';
import { createLead, getLeads } from './lead.controller.js';

// ─── Router ───
const router = Router();
router.post('/', createLead);
router.get('/', getLeads);

export default router;

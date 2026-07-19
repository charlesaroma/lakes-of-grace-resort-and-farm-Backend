import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getAuditLogs, getAuditLog, getAuditLogsByEntity } from './auditLog.controller.js';

const router = Router();

router.get('/', requireAuth, getAuditLogs);
router.get('/entity/:entityType', requireAuth, getAuditLogsByEntity);
router.get('/:id', requireAuth, getAuditLog);

export default router;

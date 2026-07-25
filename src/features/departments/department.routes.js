import { Router } from 'express';
import {
  listDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment,
} from './department.controller.js';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware.js';

const router = Router();

router.get('/', listDepartments);
router.get('/:id', requireAuth, requireRole('manager', 'system_developer'), getDepartment);
router.post('/', requireAuth, requireRole('manager', 'system_developer'), createDepartment);
router.put('/:id', requireAuth, requireRole('manager', 'system_developer'), updateDepartment);
router.delete('/:id', requireAuth, requireRole('manager', 'system_developer'), deleteDepartment);

export default router;

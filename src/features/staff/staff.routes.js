import { Router } from 'express';
import {
  listStaff, getStaff, createStaff, updateStaff, deleteStaff, linkUser, unlinkUser,
} from './staff.controller.js';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('manager', 'system_developer'));

router.get('/', listStaff);
router.get('/:id', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);
router.post('/:id/link-user', linkUser);
router.post('/:id/unlink-user', unlinkUser);

export default router;

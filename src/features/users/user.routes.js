import { Router } from 'express';
import {
  getProfile, listUsers, getUser, createUser, updateUser, deleteUser, updateProfile, resetPassword,
} from './user.controller.js';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware.js';

// ─── Router ───
const router = Router();

router.get('/me', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);
router.get('/', requireAuth, requireRole('manager', 'system_developer'), listUsers);
router.get('/:id', requireAuth, requireRole('manager', 'system_developer'), getUser);
router.post('/', requireAuth, requireRole('manager', 'system_developer'), createUser);
router.put('/:id', requireAuth, requireRole('manager', 'system_developer'), updateUser);
router.delete('/:id', requireAuth, requireRole('manager', 'system_developer'), deleteUser);
router.post('/:id/reset-password', requireAuth, requireRole('manager', 'system_developer'), resetPassword);

export default router;

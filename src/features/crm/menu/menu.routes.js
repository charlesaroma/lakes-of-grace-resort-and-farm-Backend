import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem } from './menu.controller.js';

const router = Router();

router.get('/', requireAuth, getMenuItems);
router.get('/:id', requireAuth, getMenuItem);
router.post('/', requireAuth, createMenuItem);
router.put('/:id', requireAuth, updateMenuItem);
router.delete('/:id', requireAuth, deleteMenuItem);

export default router;

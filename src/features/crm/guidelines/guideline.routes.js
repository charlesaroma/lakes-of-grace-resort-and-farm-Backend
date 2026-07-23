import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getPublicGuidelines,
  getGuidelines,
  getGuideline,
  createGuideline,
  updateGuideline,
  deleteGuideline,
} from './guideline.controller.js';

const router = Router();

router.get('/public', getPublicGuidelines);

router.get('/', requireAuth, getGuidelines);
router.get('/:id', requireAuth, getGuideline);
router.post('/', requireAuth, createGuideline);
router.put('/:id', requireAuth, updateGuideline);
router.delete('/:id', requireAuth, deleteGuideline);

export default router;

import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getMedia, getMediaItem, createMedia, deleteMedia } from './media.controller.js';

const router = Router();

router.get('/', requireAuth, getMedia);
router.get('/:id', requireAuth, getMediaItem);
router.post('/', requireAuth, createMedia);
router.delete('/:id', requireAuth, deleteMedia);

export default router;

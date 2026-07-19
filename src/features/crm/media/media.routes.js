import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getMedia, getMediaItem, createMedia, deleteMedia } from './media.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', requireAuth, getMedia);
router.get('/:id', requireAuth, getMediaItem);
router.post('/', requireAuth, upload.array('files', 20), createMedia);
router.delete('/:id', requireAuth, deleteMedia);

export default router;

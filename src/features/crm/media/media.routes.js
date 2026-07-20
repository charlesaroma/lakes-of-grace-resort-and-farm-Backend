import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import { getMedia, getMediaItem, createMedia, deleteMedia, getAuthParams, recordMedia, updateMedia, getTagConfig, updateTagConfig } from './media.controller.js';
import { handleWebhook } from './media.webhook.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

router.get('/', requireAuth, getMedia);
router.get('/auth', requireAuth, getAuthParams);
router.get('/tag-config', requireAuth, getTagConfig);
router.put('/tag-config', requireAuth, updateTagConfig);
router.post('/record', requireAuth, recordMedia);
router.get('/:id', requireAuth, getMediaItem);
router.post('/', requireAuth, upload.array('files', 20), createMedia);
router.patch('/:id', requireAuth, updateMedia);
router.delete('/:id', requireAuth, deleteMedia);

router.post('/webhook', handleWebhook);

export default router;

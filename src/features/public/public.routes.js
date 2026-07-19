import { Router } from 'express';
import { getMedia } from '../crm/media/media.controller.js';
import { getPublicMenuItems } from '../crm/menu/menu.controller.js';

const router = Router();

router.get('/', getMedia);
router.get('/menu', getPublicMenuItems);

export default router;

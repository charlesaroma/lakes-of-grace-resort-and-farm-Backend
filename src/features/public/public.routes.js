import { Router } from 'express';
import { getMedia } from '../crm/media/media.controller.js';
import { getPublicMenuItems } from '../crm/menu/menu.controller.js';
import { getImageCategories } from '../crm/imageCategories/imageCategory.controller.js';

// ─── Router ───
const router = Router();

router.get('/', getMedia);
router.get('/image-categories', getImageCategories);
router.get('/menu', getPublicMenuItems);

export default router;

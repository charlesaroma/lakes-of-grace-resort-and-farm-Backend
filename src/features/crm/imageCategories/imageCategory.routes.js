import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getImageCategories,
  getImageCategory,
  createImageCategory,
  updateImageCategory,
  deleteImageCategory,
} from './imageCategory.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getImageCategories);
router.get('/:id', getImageCategory);
router.post('/', createImageCategory);
router.put('/:id', updateImageCategory);
router.delete('/:id', deleteImageCategory);

export default router;

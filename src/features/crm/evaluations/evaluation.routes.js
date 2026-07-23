import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  submitEvaluation,
  getEvaluations,
  getEvaluation,
  deleteEvaluation,
} from './evaluation.controller.js';

const router = Router();

router.post('/public', submitEvaluation);

router.get('/', requireAuth, getEvaluations);
router.get('/:id', requireAuth, getEvaluation);
router.delete('/:id', requireAuth, deleteEvaluation);

export default router;

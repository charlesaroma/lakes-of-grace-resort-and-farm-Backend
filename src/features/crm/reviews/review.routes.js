import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getPublicReviews,
  getHomePageReviews,
  getReviews,
  submitReview,
  getReview,
  updateReview,
  approveReview,
  rejectReview,
  deleteReview,
} from './review.controller.js';

const router = Router();

router.get('/public', getPublicReviews);
router.get('/home', getHomePageReviews);
router.post('/public', submitReview);

router.get('/', requireAuth, getReviews);
router.post('/', requireAuth, submitReview);
router.get('/:id', requireAuth, getReview);
router.put('/:id', requireAuth, updateReview);
router.put('/:id/approve', requireAuth, approveReview);
router.put('/:id/reject', requireAuth, rejectReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;

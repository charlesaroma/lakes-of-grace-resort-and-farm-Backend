import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getRoomPricingRules,
  getRoomPricingRule,
  createRoomPricingRule,
  updateRoomPricingRule,
  deleteRoomPricingRule,
} from './roomPricing.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getRoomPricingRules);
router.get('/:id', getRoomPricingRule);
router.post('/', createRoomPricingRule);
router.put('/:id', updateRoomPricingRule);
router.delete('/:id', deleteRoomPricingRule);

export default router;

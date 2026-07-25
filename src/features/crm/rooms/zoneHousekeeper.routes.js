import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getZoneHousekeepers,
  getZoneHousekeeper,
  createZoneHousekeeper,
  updateZoneHousekeeper,
  deleteZoneHousekeeper,
} from './zoneHousekeeper.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getZoneHousekeepers);
router.get('/:id', getZoneHousekeeper);
router.post('/', createZoneHousekeeper);
router.put('/:id', updateZoneHousekeeper);
router.delete('/:id', deleteZoneHousekeeper);

export default router;

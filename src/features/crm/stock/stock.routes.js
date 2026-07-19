import { Router } from 'express';
import { requireAuth } from '../../../core/middlewares/auth.middleware.js';
import {
  getStockAlerts,
  getStockLevels,
  getStockItem,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  getStockLedger,
  restockItem,
  dispatchItem,
  adjustStock,
} from './stock.controller.js';

const router = Router();

router.get('/alerts', requireAuth, getStockAlerts);
router.get('/levels', requireAuth, getStockLevels);
router.get('/ledger', requireAuth, getStockLedger);
router.get('/:id', requireAuth, getStockItem);
router.post('/', requireAuth, createStockItem);
router.put('/:id', requireAuth, updateStockItem);
router.delete('/:id', requireAuth, deleteStockItem);
router.post('/:id/restock', requireAuth, restockItem);
router.post('/:id/dispatch', requireAuth, dispatchItem);
router.post('/:id/adjust', requireAuth, adjustStock);

export default router;

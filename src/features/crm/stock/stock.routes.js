import { Router } from 'express';
import { requireAuth, requireRole } from '../../../core/middlewares/auth.middleware.js';
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
  transferStock,
} from './stock.controller.js';
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from './location.controller.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category.controller.js';

// ─── Router ───
const router = Router();

// Locations — must be registered before `/:id`
router.get('/locations', requireAuth, getLocations);
router.post('/locations', requireAuth, requireRole('admin', 'manager'), createLocation);
router.put('/locations/:id', requireAuth, requireRole('admin', 'manager'), updateLocation);
router.delete('/locations/:id', requireAuth, requireRole('admin', 'manager'), deleteLocation);

// Categories — must be registered before `/:id`
router.get('/categories', requireAuth, getCategories);
router.post('/categories', requireAuth, requireRole('admin', 'manager'), createCategory);
router.put('/categories/:id', requireAuth, requireRole('admin', 'manager'), updateCategory);
router.delete('/categories/:id', requireAuth, requireRole('admin', 'manager'), deleteCategory);

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
router.post('/:id/transfer', requireAuth, requireRole('admin', 'manager', 'kitchen_manager'), transferStock);

export default router;

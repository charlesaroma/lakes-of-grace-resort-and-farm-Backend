import { StockItem, StockLedger } from './stock.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';

// ─── Handlers ───
export const getStockAlerts = async (req, res) => {
  const alerts = await StockItem.find({
    $expr: { $lte: ['$quantity', '$threshold'] },
  });
  res.json(alerts);
};

export const getStockLevels = async (req, res) => {
  const items = await StockItem.find().sort({ item: 1 });
  res.json(items);
};

export const getStockItem = async (req, res) => {
  const item = await StockItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  res.json(item);
};

export const createStockItem = async (req, res) => {
  const item = await StockItem.create(req.body);
  await AuditLog.create({
    action: 'Stock Item Created',
    entityType: 'Stock',
    entityId: item._id,
    actorId: req.userId,
    changes: { item: item.item, category: item.category },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.status(201).json(item);
};

export const updateStockItem = async (req, res) => {
  const item = await StockItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  await AuditLog.create({
    action: 'Stock Item Updated',
    entityType: 'Stock',
    entityId: item._id,
    actorId: req.userId,
    changes: req.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.json(item);
};

export const deleteStockItem = async (req, res) => {
  const item = await StockItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  await AuditLog.create({
    action: 'Stock Item Deleted',
    entityType: 'Stock',
    entityId: req.params.id,
    actorId: req.userId,
    changes: { item: item.item },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Stock item deleted' });
};

export const getStockLedger = async (req, res) => {
  const filter = {};
  if (req.query.itemId) filter.itemId = req.query.itemId;
  if (req.query.type) filter.type = req.query.type;
  const entries = await StockLedger.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json(entries);
};

export const restockItem = async (req, res) => {
  const { quantity, cost, supplier, note } = req.body;
  const item = await StockItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Stock item not found' });

  item.quantity += quantity;
  await item.save();

  const ledger = await StockLedger.create({
    itemId: item._id,
    item: item.item,
    type: 'restock',
    quantity,
    balance: item.quantity,
    cost,
    supplier,
    note,
    userId: req.userId,
  });

  await AuditLog.create({
    action: 'Stock Restock',
    entityType: 'Stock',
    entityId: item._id,
    actorId: req.userId,
    changes: { item: item.item, quantity, cost, supplier },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });

  res.status(201).json({ item, ledger });
};

export const dispatchItem = async (req, res) => {
  const { quantity, department, purpose, note } = req.body;
  const item = await StockItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Stock item not found' });

  if (item.quantity < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  item.quantity -= quantity;
  await item.save();

  const ledger = await StockLedger.create({
    itemId: item._id,
    item: item.item,
    type: 'dispatch',
    quantity: -quantity,
    balance: item.quantity,
    department,
    purpose,
    note,
    userId: req.userId,
  });

  const severity = item.quantity < item.threshold ? 'Warning' : 'Info';
  await AuditLog.create({
    action: 'Stock Dispatch',
    entityType: 'Stock',
    entityId: item._id,
    actorId: req.userId,
    changes: { item: item.item, quantity, department, purpose },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity,
  });

  res.status(201).json({ item, ledger });
};

export const adjustStock = async (req, res) => {
  const { quantity, reason } = req.body;
  const item = await StockItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Stock item not found' });

  const variance = quantity - item.quantity;
  item.quantity = quantity;
  await item.save();

  const ledger = await StockLedger.create({
    itemId: item._id,
    item: item.item,
    type: 'adjustment',
    quantity: variance,
    balance: item.quantity,
    reason,
    userId: req.userId,
  });

  await AuditLog.create({
    action: 'Stock Adjustment',
    entityType: 'Stock',
    entityId: item._id,
    actorId: req.userId,
    changes: { item: item.item, previous: item.quantity - variance, new: quantity, reason },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });

  res.status(201).json({ item, ledger });
};

import prisma from '../../../lib/prisma.js';

export const getStockAlerts = async (req, res) => {
  const items = await prisma.stockItem.findMany();
  const alerts = items.filter((i) => i.quantity <= i.threshold);
  res.json(alerts);
};

export const getStockLevels = async (req, res) => {
  const items = await prisma.stockItem.findMany({ orderBy: { item: 'asc' } });
  res.json(items);
};

export const getStockItem = async (req, res) => {
  const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  res.json(item);
};

export const createStockItem = async (req, res) => {
  const item = await prisma.stockItem.create({ data: req.body });
  await prisma.auditLog.create({
    data: {
      action: 'Stock Item Created',
      entityType: 'Stock',
      entityId: item.id,
      actorId: req.userId,
      changes: { item: item.item, category: item.category },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.status(201).json(item);
};

export const updateStockItem = async (req, res) => {
  const item = await prisma.stockItem.update({ where: { id: req.params.id }, data: req.body });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  await prisma.auditLog.create({
    data: {
      action: 'Stock Item Updated',
      entityType: 'Stock',
      entityId: item.id,
      actorId: req.userId,
      changes: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.json(item);
};

export const deleteStockItem = async (req, res) => {
  const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  await prisma.stockItem.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Stock Item Deleted',
      entityType: 'Stock',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { item: item.item },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Stock item deleted' });
};

export const getStockLedger = async (req, res) => {
  const where = {};
  if (req.query.itemId) where.itemId = req.query.itemId;
  if (req.query.type) where.type = req.query.type;
  const entries = await prisma.stockLedger.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(entries);
};

export const restockItem = async (req, res) => {
  const { quantity, cost, supplier, note } = req.body;
  const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });

  const newQuantity = item.quantity + quantity;
  const updatedItem = await prisma.stockItem.update({
    where: { id: req.params.id },
    data: { quantity: newQuantity },
  });

  const ledger = await prisma.stockLedger.create({
    data: {
      itemId: item.id,
      item: item.item,
      type: 'restock',
      quantity,
      balance: newQuantity,
      cost: cost || 0,
      supplier,
      note,
      userId: req.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'Stock Restock',
      entityType: 'Stock',
      entityId: item.id,
      actorId: req.userId,
      changes: { item: item.item, quantity, cost, supplier },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });

  res.status(201).json({ item: updatedItem, ledger });
};

export const dispatchItem = async (req, res) => {
  const { quantity, department, purpose, note } = req.body;
  const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });

  if (item.quantity < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  const newQuantity = item.quantity - quantity;
  const updatedItem = await prisma.stockItem.update({
    where: { id: req.params.id },
    data: { quantity: newQuantity },
  });

  const ledger = await prisma.stockLedger.create({
    data: {
      itemId: item.id,
      item: item.item,
      type: 'dispatch',
      quantity: -quantity,
      balance: newQuantity,
      department,
      purpose,
      note,
      userId: req.userId,
    },
  });

  const severity = newQuantity < item.threshold ? 'Warning' : 'Info';
  await prisma.auditLog.create({
    data: {
      action: 'Stock Dispatch',
      entityType: 'Stock',
      entityId: item.id,
      actorId: req.userId,
      changes: { item: item.item, quantity, department, purpose },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity,
    },
  });

  res.status(201).json({ item: updatedItem, ledger });
};

export const adjustStock = async (req, res) => {
  const { quantity, reason } = req.body;
  const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });

  const variance = quantity - item.quantity;
  const updatedItem = await prisma.stockItem.update({
    where: { id: req.params.id },
    data: { quantity },
  });

  const ledger = await prisma.stockLedger.create({
    data: {
      itemId: item.id,
      item: item.item,
      type: 'adjustment',
      quantity: variance,
      balance: quantity,
      reason,
      userId: req.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'Stock Adjustment',
      entityType: 'Stock',
      entityId: item.id,
      actorId: req.userId,
      changes: { item: item.item, previous: item.quantity, new: quantity, reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });

  res.status(201).json({ item: updatedItem, ledger });
};

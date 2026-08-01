import prisma from '../../../lib/prisma.js';

const EDITABLE_FIELDS = ['item', 'category', 'unit', 'threshold', 'parLevel'];

export const getStockAlerts = async (req, res) => {
  const items = await prisma.stockItem.findMany();
  const alerts = items.filter((i) => i.quantity <= i.threshold);
  res.json(alerts);
};

export const getStockLevels = async (req, res) => {
  const items = await prisma.stockItem.findMany({ orderBy: { item: 'asc' } });
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [dispatchRows, lastRestocks, lastDispatches] = await Promise.all([
    prisma.stockLedger.groupBy({
      by: ['itemId'],
      where: { type: 'dispatch', createdAt: { gte: since } },
      _sum: { quantity: true },
    }),
    prisma.stockLedger.groupBy({
      by: ['itemId'],
      where: { type: 'restock' },
      _max: { createdAt: true },
    }),
    prisma.stockLedger.groupBy({
      by: ['itemId'],
      where: { type: 'dispatch' },
      _max: { createdAt: true },
    }),
  ]);

  const consumedMap = new Map(dispatchRows.map((r) => [r.itemId, Math.abs(r._sum.quantity || 0)]));
  const restockedAtMap = new Map(lastRestocks.map((r) => [r.itemId, r._max.createdAt]));
  const dispatchedAtMap = new Map(lastDispatches.map((r) => [r.itemId, r._max.createdAt]));

  const enriched = items.map((item) => {
    const consumed = consumedMap.get(item.id) || 0;
    const avgDaily = consumed / 30;

    let status = 'Optimal';
    if (item.quantity <= 0) status = 'Out of Stock';
    else if (item.threshold > 0 && item.quantity <= Math.floor(item.threshold * 0.25)) status = 'Critical';
    else if (item.quantity <= item.threshold) status = 'Low Stock';

    return {
      ...item,
      status,
      avgDailyConsumption: Math.round(avgDaily * 10) / 10,
      daysLeft: avgDaily > 0 ? Math.round((item.quantity / avgDaily) * 10) / 10 : null,
      lastRestockedAt: restockedAtMap.get(item.id) || null,
      lastDispatchedAt: dispatchedAtMap.get(item.id) || null,
    };
  });

  res.json(enriched);
};

export const getStockItem = async (req, res) => {
  const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  res.json(item);
};

export const createStockItem = async (req, res) => {
  const data = { quantity: 0 };
  for (const field of EDITABLE_FIELDS) {
    if (field in (req.body || {})) data[field] = req.body[field];
  }
  const item = await prisma.stockItem.create({ data });
  req.app.get('io')?.emit?.('stockItems:created', item);
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
  if (req.body && 'quantity' in req.body) {
    return res.status(400).json({ message: 'Quantity cannot be edited directly. Use the Adjust action instead.' });
  }

  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in (req.body || {})) data[field] = req.body[field];
  }

  const item = await prisma.stockItem.update({ where: { id: req.params.id }, data });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  req.app.get('io')?.emit?.('stockItems:updated', item);
  await prisma.auditLog.create({
    data: {
      action: 'Stock Item Updated',
      entityType: 'Stock',
      entityId: item.id,
      actorId: req.userId,
      changes: data,
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
  req.app.get('io')?.emit?.('stockItems:deleted', { id: req.params.id });
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
  const { updatedItem, ledger } = await prisma.$transaction(async (tx) => {
    const ledger = await tx.stockLedger.create({
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
    const updatedItem = await tx.stockItem.update({
      where: { id: item.id },
      data: { quantity: newQuantity },
    });
    return { updatedItem, ledger };
  });

  req.app.get('io')?.emit?.('stockItems:updated', updatedItem);
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
  const { updatedItem, ledger } = await prisma.$transaction(async (tx) => {
    const ledger = await tx.stockLedger.create({
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
    const updatedItem = await tx.stockItem.update({
      where: { id: item.id },
      data: { quantity: newQuantity },
    });
    return { updatedItem, ledger };
  });

  const severity = newQuantity < item.threshold ? 'Warning' : 'Info';
  req.app.get('io')?.emit?.('stockItems:updated', updatedItem);
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
  const { updatedItem, ledger } = await prisma.$transaction(async (tx) => {
    const ledger = await tx.stockLedger.create({
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
    const updatedItem = await tx.stockItem.update({
      where: { id: item.id },
      data: { quantity },
    });
    return { updatedItem, ledger };
  });

  req.app.get('io')?.emit?.('stockItems:updated', updatedItem);
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

import prisma from '../../../lib/prisma.js';
import { getStatus, computeDaysLeft, suggestedRestockQty } from '../../../core/utils/stockStatus.js';

const EDITABLE_FIELDS = ['item', 'category', 'unit', 'threshold', 'parLevel', 'locationId'];

export const getStockAlerts = async (req, res) => {
  const where = {};
  if (req.query.locationId) where.locationId = req.query.locationId;
  const items = await prisma.stockItem.findMany({ where });
  const alerts = items
    .filter((i) => i.quantity <= i.threshold)
    .map((item) => ({ ...item, status: getStatus(item.quantity, item.threshold) }));
  res.json(alerts);
};

export const getStockLevels = async (req, res) => {
  const where = {};
  if (req.query.locationId) where.locationId = req.query.locationId;
  const items = await prisma.stockItem.findMany({ where, orderBy: { item: 'asc' }, include: { location: true } });
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

    const status = getStatus(item.quantity, item.threshold);

    return {
      ...item,
      status,
      avgDailyConsumption: Math.round(avgDaily * 10) / 10,
      daysLeft: computeDaysLeft(item.quantity, avgDaily),
      suggestedRestockQty: suggestedRestockQty(item, avgDaily),
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

const DISPATCH_DEPARTMENTS = ['kitchen', 'housekeeping', 'farm', 'maintenance'];

export const dispatchItem = async (req, res) => {
  const { quantity, department, purpose, note } = req.body;

  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive number' });
  }
  if (typeof department !== 'string' || !DISPATCH_DEPARTMENTS.includes(department)) {
    return res.status(400).json({ message: 'Department is required and must be a valid department' });
  }
  if (typeof purpose !== 'string' || !purpose.trim()) {
    return res.status(400).json({ message: 'Purpose of dispatch is required' });
  }

  const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });

  if (item.quantity < parsedQuantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  const newQuantity = item.quantity - parsedQuantity;
  const { updatedItem, ledger } = await prisma.$transaction(async (tx) => {
    const ledger = await tx.stockLedger.create({
      data: {
        itemId: item.id,
        item: item.item,
        type: 'dispatch',
        quantity: -parsedQuantity,
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
      changes: { item: item.item, quantity: parsedQuantity, department, purpose },
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

export const transferStock = async (req, res) => {
  const { destinationLocationId, quantity, note } = req.body;
  const item = await prisma.stockItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  if (!destinationLocationId) return res.status(400).json({ message: 'Destination location is required' });
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }
  if (String(destinationLocationId) === String(item.locationId)) {
    return res.status(400).json({ message: 'Source and destination are the same location' });
  }
  if (item.quantity < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  const destination = await prisma.stockLocation.findUnique({ where: { id: destinationLocationId } });
  if (!destination) return res.status(404).json({ message: 'Destination location not found' });
  if (destination.isActive === false) {
    return res.status(400).json({ message: 'Destination location is inactive' });
  }

  const result = await prisma.$transaction(async (tx) => {
    const sourceQuantity = item.quantity - quantity;

    let target = await tx.stockItem.findFirst({
      where: { item: item.item, locationId: destinationLocationId },
    });
    if (!target) {
      target = await tx.stockItem.create({
        data: {
          item: item.item,
          category: item.category,
          unit: item.unit,
          threshold: item.threshold,
          parLevel: item.parLevel,
          perishable: item.perishable,
          locationId: destinationLocationId,
          quantity: 0,
        },
      });
    }
    const targetQuantity = target.quantity + quantity;

    await tx.stockLedger.create({
      data: {
        itemId: item.id,
        item: item.item,
        type: 'transfer',
        quantity: -quantity,
        balance: sourceQuantity,
        note: `Transferred to ${destination.name}${note ? ` — ${note}` : ''}`,
        userId: req.userId,
      },
    });
    await tx.stockLedger.create({
      data: {
        itemId: target.id,
        item: item.item,
        type: 'transfer',
        quantity,
        balance: targetQuantity,
        note: `Transferred from ${item.location?.name || 'Central Store'}${note ? ` — ${note}` : ''}`,
        userId: req.userId,
      },
    });

    const [updatedSource, updatedTarget] = await Promise.all([
      tx.stockItem.update({ where: { id: item.id }, data: { quantity: sourceQuantity } }),
      tx.stockItem.update({ where: { id: target.id }, data: { quantity: targetQuantity } }),
    ]);
    return { updatedSource, updatedTarget };
  });

  req.app.get('io')?.emit?.('stockItems:updated', result.updatedSource);
  req.app.get('io')?.emit?.('stockItems:updated', result.updatedTarget);
  await prisma.auditLog.create({
    data: {
      action: 'Stock Transfer',
      entityType: 'Stock',
      entityId: item.id,
      actorId: req.userId,
      changes: { item: item.item, quantity, from: item.location?.name || 'Central Store', to: destination.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });

  res.status(201).json({ source: result.updatedSource, destination: result.updatedTarget });
};

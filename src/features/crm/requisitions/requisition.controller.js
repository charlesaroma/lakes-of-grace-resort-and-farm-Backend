import { randomBytes } from 'node:crypto';
import prisma from '../../../lib/prisma.js';

const STATUSES = ['pending', 'approved', 'fulfilled', 'cancelled'];

const ROLE_DEPARTMENT_MAP = {
  kitchen_manager: 'kitchen',
  housekeeper_mobile: 'housekeeping',
};

const RECEIVER_ROLES = ['system_developer', 'admin'];

const isReceiver = (role) => RECEIVER_ROLES.includes(role);

const fetchUser = (id) => prisma.user.findUnique({ where: { id } });

const makeReference = async (retry = 0) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  const reference = `REQ-${date}-${suffix}`;
  const existing = await prisma.requisition.findUnique({ where: { reference } });
  if (existing && retry < 3) return makeReference(retry + 1);
  return reference;
};

const logAudit = (req, action, entityId, changes, severity = 'Info') => {
  return prisma.auditLog.create({
    data: {
      action,
      entityType: 'Requisition',
      entityId,
      actorId: req.userId,
      changes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity,
    },
  });
};

const itemsWithDetail = async (items) => {
  const ids = items.map((i) => i.itemId);
  const stockItems = await prisma.stockItem.findMany({ where: { id: { in: ids } } });
  const stockMap = new Map(stockItems.map((s) => [s.id, s]));
  return items.map((i) => ({
    ...i,
    stockItem: stockMap.get(i.itemId) || null,
  }));
};

export const getRequisitions = async (req, res) => {
  const where = {};
  if (req.query.status && STATUSES.includes(req.query.status)) where.status = req.query.status;
  if (req.query.department) where.department = req.query.department;

  const requisitions = await prisma.requisition.findMany({
    where,
    include: { items: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  const withDetail = await Promise.all(
    requisitions.map(async (r) => ({ ...r, items: await itemsWithDetail(r.items) })),
  );
  res.json(withDetail);
};

export const getRequisition = async (req, res) => {
  const requisition = await prisma.requisition.findUnique({
    where: { id: req.params.id },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
  if (!requisition) return res.status(404).json({ message: 'Requisition not found' });

  const items = await itemsWithDetail(requisition.items);
  res.json({ ...requisition, items });
};

export const createRequisition = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ message: 'User not found' });

  const roleDepartment = ROLE_DEPARTMENT_MAP[user.role];
  if (!roleDepartment) {
    return res.status(403).json({ message: 'Only housekeeping and kitchen manager accounts can create requisitions' });
  }

  const { department = roleDepartment, requestedBy, note, items } = req.body || {};

  if (!department || !requestedBy) {
    return res.status(400).json({ message: 'Department and requestedBy are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one item is required' });
  }

  const normalized = [];
  const seen = new Set();
  for (const line of items) {
    if (!line.itemId) return res.status(400).json({ message: 'Each item requires an itemId' });
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Item quantities must be positive whole numbers' });
    }
    if (seen.has(line.itemId)) return res.status(400).json({ message: 'Duplicate item in requisition' });
    seen.add(line.itemId);

    const stock = await prisma.stockItem.findUnique({ where: { id: line.itemId } });
    if (!stock) return res.status(400).json({ message: `Stock item ${line.itemId} not found` });

    normalized.push({
      itemId: stock.id,
      item: stock.item,
      unit: stock.unit || 'pieces',
      quantityRequested: quantity,
      note: line.note,
    });
  }

  const reference = await makeReference();
  const requisition = await prisma.requisition.create({
    data: {
      reference,
      department,
      requestedBy,
      requestedById: req.userId,
      note,
      items: { create: normalized },
    },
    include: { items: true },
  });

  req.app.get('io')?.emit?.('requisitions:created', requisition);
  await logAudit(req, 'Requisition Created', requisition.id, {
    reference,
    department,
    items: normalized.length,
  });
  res.status(201).json(requisition);
};

export const updateRequisition = async (req, res) => {
  const existing = await prisma.requisition.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Requisition not found' });
  if (existing.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending requisitions can be edited' });
  }

  const user = await fetchUser(req.userId);
  if (!user) return res.status(401).json({ message: 'User not found' });
  const canEdit = isReceiver(user.role) || existing.requestedById === req.userId;
  if (!canEdit) {
    return res.status(403).json({ message: 'Only the requester or a super admin can edit this requisition' });
  }

  const data = {};
  if (req.body && 'department' in req.body) data.department = req.body.department;
  if (req.body && 'note' in req.body) data.note = req.body.note;

  const requisition = await prisma.requisition.update({ where: { id: req.params.id }, data });
  req.app.get('io')?.emit?.('requisitions:updated', requisition);
  await logAudit(req, 'Requisition Updated', requisition.id, data);
  res.json(requisition);
};

export const approveRequisition = async (req, res) => {
  const existing = await prisma.requisition.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Requisition not found' });
  if (existing.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending requisitions can be approved' });
  }

  const approver = await fetchUser(req.userId);
  if (!approver) return res.status(401).json({ message: 'User not found' });
  if (!isReceiver(approver.role)) {
    return res.status(403).json({ message: 'Only super admins can approve requisitions' });
  }

  const requisition = await prisma.requisition.update({
    where: { id: req.params.id },
    data: {
      status: 'approved',
      approvedById: req.userId,
      approvedByName: approver?.name || approver?.username || null,
      approvedAt: new Date(),
    },
  });

  req.app.get('io')?.emit?.('requisitions:updated', requisition);
  await logAudit(req, 'Requisition Approved', requisition.id, { reference: existing.reference });
  res.json(requisition);
};

export const cancelRequisition = async (req, res) => {
  const existing = await prisma.requisition.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Requisition not found' });
  if (existing.status === 'fulfilled' || existing.status === 'cancelled') {
    return res.status(400).json({ message: 'This requisition can no longer be cancelled' });
  }

  const user = await fetchUser(req.userId);
  if (!user) return res.status(401).json({ message: 'User not found' });
  const canCancel = isReceiver(user.role) || existing.requestedById === req.userId;
  if (!canCancel) {
    return res.status(403).json({ message: 'Only the requester or a super admin can cancel this requisition' });
  }

  const requisition = await prisma.requisition.update({
    where: { id: req.params.id },
    data: { status: 'cancelled' },
  });

  req.app.get('io')?.emit?.('requisitions:updated', requisition);
  await logAudit(req, 'Requisition Cancelled', requisition.id, { reference: existing.reference }, 'Warning');
  res.json(requisition);
};

export const fulfillRequisition = async (req, res) => {
  const existing = await prisma.requisition.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!existing) return res.status(404).json({ message: 'Requisition not found' });
  if (existing.status !== 'approved') {
    return res.status(400).json({ message: 'Only approved requisitions can be fulfilled' });
  }

  const user = await fetchUser(req.userId);
  if (!user) return res.status(401).json({ message: 'User not found' });
  if (!isReceiver(user.role)) {
    return res.status(403).json({ message: 'Only super admins can fulfill requisitions' });
  }

  const stockItems = await prisma.stockItem.findMany({
    where: { id: { in: existing.items.map((i) => i.itemId) } },
  });
  const stockMap = new Map(stockItems.map((s) => [s.id, s]));

  const shortages = existing.items
    .filter((line) => (stockMap.get(line.itemId)?.quantity || 0) < line.quantityRequested)
    .map((line) => ({
      item: line.item,
      requested: line.quantityRequested,
      available: stockMap.get(line.itemId)?.quantity || 0,
    }));
  if (shortages.length > 0) {
    return res.status(400).json({ message: 'Insufficient stock', shortages });
  }

  const { requisition, ledgers } = await prisma.$transaction(async (tx) => {
    const ledgers = [];
    for (const line of existing.items) {
      const stock = stockMap.get(line.itemId);
      const newQuantity = stock.quantity - line.quantityRequested;
      const ledger = await tx.stockLedger.create({
        data: {
          itemId: stock.id,
          item: stock.item,
          type: 'dispatch',
          quantity: -line.quantityRequested,
          balance: newQuantity,
          department: existing.department,
          purpose: `Requisition ${existing.reference}`,
          note: line.note,
          userId: req.userId,
        },
      });
      ledgers.push(ledger);
      await tx.stockItem.update({
        where: { id: stock.id },
        data: { quantity: newQuantity },
      });
      await tx.requisitionItem.update({
        where: { id: line.id },
        data: { quantityFulfilled: line.quantityRequested },
      });
    }

    const requisition = await tx.requisition.update({
      where: { id: existing.id },
      data: { status: 'fulfilled', fulfilledAt: new Date() },
      include: { items: true },
    });
    return { requisition, ledgers };
  });

  for (const ledger of ledgers) {
    req.app.get('io')?.emit?.('stockItems:updated', { id: ledger.itemId });
  }
  req.app.get('io')?.emit?.('requisitions:updated', requisition);
  await logAudit(req, 'Requisition Fulfilled', requisition.id, {
    reference: existing.reference,
    items: existing.items.length,
  });
  res.json({ requisition, ledgers });
};

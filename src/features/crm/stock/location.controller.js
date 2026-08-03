import prisma from '../../../lib/prisma.js';

const EDITABLE_FIELDS = ['name', 'type', 'parentId', 'isActive'];

export const getLocations = async (req, res) => {
  const locations = await prisma.stockLocation.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { items: true } } },
  });
  res.json(locations);
};

export const createLocation = async (req, res) => {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in (req.body || {})) data[field] = req.body[field];
  }
  if (!data.name) return res.status(400).json({ message: 'Location name is required' });
  if (!['central', 'department'].includes(data.type)) data.type = 'department';

  let location;
  try {
    location = await prisma.stockLocation.create({ data });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A location with that name already exists' });
    }
    throw err;
  }

  await prisma.auditLog.create({
    data: {
      action: 'Stock Location Created',
      entityType: 'Stock',
      entityId: location.id,
      actorId: req.userId,
      changes: { name: location.name, type: location.type },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.status(201).json(location);
};

export const updateLocation = async (req, res) => {
  const location = await prisma.stockLocation.findUnique({ where: { id: req.params.id } });
  if (!location) return res.status(404).json({ message: 'Location not found' });

  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in (req.body || {})) data[field] = req.body[field];
  }

  let updated;
  try {
    updated = await prisma.stockLocation.update({ where: { id: req.params.id }, data });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A location with that name already exists' });
    }
    throw err;
  }

  await prisma.auditLog.create({
    data: {
      action: 'Stock Location Updated',
      entityType: 'Stock',
      entityId: updated.id,
      actorId: req.userId,
      changes: data,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.json(updated);
};

export const deleteLocation = async (req, res) => {
  const location = await prisma.stockLocation.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { items: true } } },
  });
  if (!location) return res.status(404).json({ message: 'Location not found' });
  if (location._count.items > 0) {
    return res.status(409).json({ message: `Cannot delete — ${location._count.items} stock item(s) are assigned here. Deactivate it instead.` });
  }

  await prisma.stockLocation.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Stock Location Deleted',
      entityType: 'Stock',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { name: location.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Location deleted' });
};

import prisma from '../../../lib/prisma.js';

export const getMenuItems = async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { group: { contains: search, mode: 'insensitive' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({ where, orderBy: [{ category: 'asc' }, { group: 'asc' }, { sortOrder: 'asc' }], skip, take: limitNum }),
    prisma.menuItem.count({ where }),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getMenuItem = async (req, res) => {
  const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  res.json(item);
};

export const createMenuItem = async (req, res) => {
  const item = await prisma.menuItem.create({ data: req.body });
  await prisma.auditLog.create({
    data: {
      action: 'Menu Item Added',
      entityType: 'Menu',
      entityId: item.id,
      actorId: req.userId,
      changes: { title: item.title, category: item.category },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.status(201).json(item);
};

export const updateMenuItem = async (req, res) => {
  const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: req.body });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  await prisma.auditLog.create({
    data: {
      action: 'Menu Item Updated',
      entityType: 'Menu',
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

export const getPublicMenuItems = async (req, res) => {
  const items = await prisma.menuItem.findMany({
    where: { status: 'Active' },
    orderBy: [{ category: 'asc' }, { group: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json(items);
};

export const deleteMenuItem = async (req, res) => {
  const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  await prisma.menuItem.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Menu Item Deleted',
      entityType: 'Menu',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { title: item.title },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Menu item deleted' });
};

import prisma from '../../../lib/prisma.js';

const EDITABLE_FIELDS = ['name', 'isActive'];

export const getCategories = async (req, res) => {
  const [categories, itemCounts] = await Promise.all([
    prisma.stockCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.stockItem.groupBy({ by: ['category'], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(itemCounts.map((row) => [row.category, row._count._all]));
  const result = categories.map((category) => ({
    ...category,
    _count: { items: counts[category.name] ?? 0 },
  }));
  res.json(result);
};

export const createCategory = async (req, res) => {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in (req.body || {})) data[field] = req.body[field];
  }
  if (!data.name) return res.status(400).json({ message: 'Category name is required' });

  let category;
  try {
    category = await prisma.stockCategory.create({ data });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A category with that name already exists' });
    }
    throw err;
  }

  await prisma.auditLog.create({
    data: {
      action: 'Stock Category Created',
      entityType: 'Stock',
      entityId: category.id,
      actorId: req.userId,
      changes: { name: category.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.status(201).json(category);
};

export const updateCategory = async (req, res) => {
  const category = await prisma.stockCategory.findUnique({ where: { id: req.params.id } });
  if (!category) return res.status(404).json({ message: 'Category not found' });

  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in (req.body || {})) data[field] = req.body[field];
  }

  let updated;
  try {
    updated = await prisma.stockCategory.update({ where: { id: req.params.id }, data });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A category with that name already exists' });
    }
    throw err;
  }

  if (data.name && data.name !== category.name) {
    await prisma.stockItem.updateMany({
      where: { category: category.name },
      data: { category: data.name },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: 'Stock Category Updated',
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

export const deleteCategory = async (req, res) => {
  const category = await prisma.stockCategory.findUnique({ where: { id: req.params.id } });
  if (!category) return res.status(404).json({ message: 'Category not found' });

  const itemCount = await prisma.stockItem.count({ where: { category: category.name } });
  if (itemCount > 0) {
    return res.status(409).json({ message: `Cannot delete — ${itemCount} stock item(s) use this category. Deactivate it instead.` });
  }

  await prisma.stockCategory.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Stock Category Deleted',
      entityType: 'Stock',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { name: category.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Category deleted' });
};

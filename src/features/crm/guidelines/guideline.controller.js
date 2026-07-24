import { prisma } from '../../../lib/prisma.js';
import { createGuidelineSchema, updateGuidelineSchema } from '../../../../shared/schemas/guideline.schema.js';

export const getPublicGuidelines = async (req, res) => {
  const guidelines = await prisma.guideline.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });
  res.json(guidelines);
};

export const getGuidelines = async (req, res) => {
  const { category, search } = req.query;
  const where = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  const items = await prisma.guideline.findMany({ where, orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });
  res.json(items);
};

export const getGuideline = async (req, res) => {
  const item = await prisma.guideline.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Guideline not found' });
  res.json(item);
};

export const createGuideline = async (req, res) => {
  const result = createGuidelineSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await prisma.guideline.create({ data: result.data });
  await prisma.auditLog.create({
    data: {
      action: 'Guideline Created',
      entityType: 'Guideline',
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

export const updateGuideline = async (req, res) => {
  const result = updateGuidelineSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await prisma.guideline.update({ where: { id: req.params.id }, data: result.data });
  if (!item) return res.status(404).json({ message: 'Guideline not found' });
  await prisma.auditLog.create({
    data: {
      action: 'Guideline Updated',
      entityType: 'Guideline',
      entityId: item.id,
      actorId: req.userId,
      changes: result.data,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.json(item);
};

export const deleteGuideline = async (req, res) => {
  const item = await prisma.guideline.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Guideline not found' });
  await prisma.guideline.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Guideline Deleted',
      entityType: 'Guideline',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { title: item.title },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Guideline deleted' });
};
